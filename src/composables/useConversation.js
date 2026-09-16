import { storeToRefs } from 'pinia'
import { computed, provide, ref, watch, nextTick } from 'vue'

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
  const mainStatusId = computed(() => mainStatus.value?.id)

  // # Config
  const { mergedConfig } = storeToRefs(useMergedConfigStore())
  const { mastoUserSocketStatus } = storeToRefs(useStreamingStore())
  const streamingEnabled = computed(
    () =>
      mergedConfig.value.useStreamingApi &&
      mastoUserSocketStatus === WSConnectionStatus.JOINED,
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
    () => mainStatus.value?.statusnet_conversation_id,
  )
  watch(conversationId, (neu, old) => {
    if (neu !== old) fullyLoaded.value = false
  })
  const conversation = computed(() => {
    if (!currentStatus.value) {
      return []
    }

    if (!expanded.value || !fullyLoaded.value) {
      return [currentStatus.value]
    }

    const fullConversation = useStatusesStore().conversations.get(
      conversationId.value,
    )

    return [...fullConversation.keys()]
      .map((k) => useStatusesStore().allStatuses.get(k))
      .filter((status) => status.type != 'repeat') // Old backend behavior?
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
  provide('conversation', conversation)
  provide('replies', replies)

  const fetchConversation = async () => {
    if (currentStatus.value) {
      const {
        data: { ancestors, descendants },
        timestamp,
      } = await apiFetchConversation({
        id: statusId.value,
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
      try {
        loadError.value = null

        const { data: status } = await apiFetchStatus({
          id: statusId.value,
          credentials: useOAuthStore().token,
        })

        useStatusesStore().addNewStatuses({ statuses: [status] })

        fetchConversation()
      } catch (error) {
        console.error(error)
        loadError.value = error
      }
    }
  }

  // # Focus
  const focused = ref(null)
  const { mainStatus: focusedStatus } = useMainStatus(focused)
  const setFocused = (id) => {
    focused.value = id
  }
  watch(statusId, (val) => setFocused(val), { immediate: true })

  const focusedId = computed(() => (expanded.value && fullyLoaded.value) ? focusedStatus.value?.id : null)
  provide('focusedId', focusedId)

  watch(
    focusedStatus,
    (newVal, oldVal) => {
      if (!newVal) return
      if (newVal?.id === oldVal?.id) return // prevents infinite loop
      if (!streamingEnabled.value) {
        useStatusesStore().fetchStatus(newVal.id)
      }

      useStatusesStore().fetchFavsAndRepeats(newVal.id)
      useStatusesStore().fetchEmojiReactions(newVal.id)
    },
    { immediate: true },
  )

  return {
    focusedId,
    conversationId,
    setFocused,
    currentStatus,
    mainStatus,
    conversation,
    replies,
    getReplies,
    fetchConversation,
    loadError,
  }
}
