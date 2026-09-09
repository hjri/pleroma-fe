import { get } from 'lodash-es'
import { computed, provide, ref } from 'vue'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import {
  fetchConversation as apiFetchConversation,
  fetchStatus as apiFetchStatus,
} from 'src/api/public.js'

export function useConversation(statusId, expanded) {
  const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)
  const getConversationId = (statusId) => {
    const status = getStatusObject(statusId)
    return get(
      status,
      'retweeted_status.statusnet_conversation_id',
      get(status, 'statusnet_conversation_id'),
    )
  }

  const loadError = ref(null)
  const currentStatus = computed(() => getStatusObject(statusId.value))

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
  const conversationId = computed(() => getConversationId(statusId.value))
  const conversation = computed(() => {
    if (!currentStatus.value) {
      return []
    }

    if (!expanded.value) {
      return [currentStatus.value]
    }

    const conversation = useStatusesStore().conversations.get(
      conversationId.value,
    )

    return [...conversation.keys()]
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

  return {
    currentStatus,
    conversation,
    replies,
    getReplies,
    fetchConversation,
    loadError,
  }
}
