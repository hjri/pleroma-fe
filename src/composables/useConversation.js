import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, toValue, watch } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'

import { useMainStatus } from 'src/composables/useMainStatus.js'

import {
  fetchConversation as apiFetchConversation,
  fetchStatus as apiFetchStatus,
} from 'src/api/public.js'
import { WSConnectionStatus } from 'src/api/websocket.js'

export function useConversation(statusId, expanded) {
  const loadError = ref(null)
  const { status: currentStatus, mainStatus } = useMainStatus(statusId)

  // # Config
  const { mergedConfig } = storeToRefs(useMergedConfigStore())
  const { mastoUserSocketStatus } = storeToRefs(useStreamingStore())
  const streamingEnabled = computed(
    () =>
      mergedConfig.value.useStreamingApi &&
      mastoUserSocketStatus.value === WSConnectionStatus.JOINED,
  )

  watch(statusId, (neu, old) => {
    if (neu !== old) {
      fetchConversation()
    }
  })

  const sortById = (a, b) => {
    const idA = a.type === 'retweet' ? a.retweeted_status.id : a.id
    const idB = b.type === 'retweet' ? b.retweeted_status.id : b.id
    const seqA = Number(idA)
    const seqB = Number(idB)
    const isSeqA = !Number.isNaN(seqA)
    const isSeqB = !Number.isNaN(seqB)
    if (isSeqA && isSeqB) {
      return seqA < seqB ? -1 : 1
    } else if (isSeqA && !isSeqB) {
      return -1
    } else if (!isSeqA && isSeqB) {
      return 1
    } else {
      return idA < idB ? -1 : 1
    }
  }
  const fullyLoaded = ref(false)
  const conversationId = computed(
    () => mainStatus.value?.statusnet_conversation_id ?? null,
  )
  watch(conversationId, (neu, old) => {
    if (neu !== old) fullyLoaded.value = false
  })
  const conversation = computed(() => {
    if (!currentStatus.value) {
      return []
    }

    if (!toValue(expanded) || !fullyLoaded.value) {
      return [currentStatus.value]
    }

    /* It took me a week or so to figure this out.
     *
     * Virtual scrolling can compensate for posts being prepended to content,
     * and prepended posts changing height. The problem is that it has to happen
     * in prepended (i.e. either above visible post and/or above screen boundary)
     *
     * Here's the problem: showing conversation from store can be broken. UI might
     * already know that some posts belong to a conversation, because you were
     * mentioned in it, but doesn't know the rest of it. It ends up displaying this
     * "partial" conversation, and then the rest loads in.
     *
     * Problem is, this partial conversation can be very fragmented, with missing
     * pieces appearing in-between posts. These pieces don't have proper heights
     * assigned to them yet but their neigbours do and neither me nor virtual
     * scrolling knows how to compensate for it, it ends up either not compensating
     * or compensating wrong.
     *
     * Using "fullyLoaded" ref helps with this, to ensure that we have stable
     * conversation expansion process of focused post -> entire convo
     *
     * With fullyLoaded:
     * **id:3** -> id:1 id:2 id:3 id:4 id:5 id:6
     *
     * Without fullyLoaded:
     * id:1 **id:3** id:5 -> id:1 id:2 **id:3** id:4 id:5 id:6
     * (focused post is **id:3**)
     *
     * After initial load, fullyLoaded remains true, allowing newer updates to
     * appear in conversation.
     */
    const fullConversation =
      useStatusesStore().conversations.get(conversationId.value) ?? new Map() // guard if this somehow fails (user wipe)

    return [...fullConversation.keys()]
      .map((k) => useStatusesStore().allStatuses.get(k))
      .filter((status) => status.type !== 'repeat') // Old backend behavior?
      .toSorted(sortById)
  })

  const replies = computed(() =>
    conversation.value.reduce(
      (result, { id, in_reply_to_status_id: irid }, index) => {
        if (irid) {
          if (!result.has(irid)) {
            result.set(irid, new Set())
          }
          result.get(irid).add({
            name: `#${index}`,
            id,
          })
        }
        return result
      },
      new Map(),
    ),
  )
  const getReplies = (id) => replies.value.get(id) ?? new Set()

  const fetchConversation = async () => {
    try {
      loadError.value = null
      if (currentStatus.value) {
        const {
          data: { ancestors, descendants },
          timestamp,
        } = await apiFetchConversation({
          id: toValue(statusId),
          credentials: useOAuthStore().token,
        })

        useStatusesStore().addNewStatuses({ statuses: ancestors, timestamp })
        useStatusesStore().addNewStatuses({
          statuses: descendants,
          timestamp,
        })

        await nextTick()
        fullyLoaded.value = true
      } else {
        const { data: status } = await apiFetchStatus({
          id: toValue(statusId),
          credentials: useOAuthStore().token,
        })

        useStatusesStore().addNewStatuses({ statuses: [status] })

        fetchConversation()
      }
    } catch (error) {
      console.error(error)
      loadError.value = error
    }
  }

  watch(
    expanded,
    (value) => {
      if (value) {
        fetchConversation()
      }
    },
    { flush: 'post' },
  )

  // # Focus
  const focused = ref(null)
  const { mainStatus: focusedStatus } = useMainStatus(focused)
  const setFocused = (id) => {
    focused.value = id
  }
  watch(statusId, (val) => setFocused(val), { immediate: true })

  const focusedId = computed(() =>
    toValue(expanded) && fullyLoaded.value ? focusedStatus.value?.id : null,
  )

  watch(
    focusedId,
    (newVal, oldVal) => {
      if (!newVal) return
      if (newVal === oldVal) return // prevents infinite loop
      if (!streamingEnabled.value) {
        useStatusesStore().fetchStatus(newVal)
      }

      useStatusesStore().fetchFavsAndRepeats(newVal)
      useStatusesStore().fetchEmojiReactions(newVal)
    },
    { immediate: true },
  )

  return {
    focusedId,
    setFocused,
    conversationId,
    currentStatus,
    mainStatus,
    conversation,
    replies,
    getReplies,
    fetchConversation,
    loadError,
  }
}
