import { maxBy, minBy } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { useChatsStore } from 'src/stores/chats.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import {
  deleteChatMessage as apiDeleteChatMessage,
  chatMessages,
  getOrCreateChat,
  readChat,
  sendChatMessage,
} from 'src/api/chats.js'
import { WSConnectionStatus } from 'src/api/websocket.js'
import { buildFakeMessage } from 'src/services/chat_utils/chat_utils.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

const MAX_RETRIES = 10

export function usePleromaChat(userId) {
  const { mergedConfig } = storeToRefs(useMergedConfigStore())
  const { mastoUserSocketStatus } = storeToRefs(useStreamingStore())

  const streamingEnabled = computed(
    () =>
      mergedConfig.value.useStreamingApi &&
      mastoUserSocketStatus === WSConnectionStatus.JOINED,
  )

  const chat = ref(null)
  const socket = ref(null)

  const error = ref(null)
  const streaming = ref(false)
  const fetcher = ref(null)
  const fetching = ref(true)

  const minId = ref(undefined)
  const maxId = ref(undefined)

  const idempotencyKeyIndex = ref(new Map())
  const messages = ref([])
  const messagesIndex = ref(new Map())
  const pendingMessages = ref([])
  const pendingMessagesIndex = ref(new Map())
  const messageRetriers = ref(new Map())

  const lastReadMessageId = ref(null)
  const newMessagesCount = ref(0)

  // # Posting & Optimism
  const { currentUser } = storeToRefs(useUsersStore())
  const sendMessage = async ({ status, media, idempotencyKey }) => {
    const params = {
      id: chat.value.id,
      content: status,
      idempotencyKey,
    }

    if (media[0]) {
      params.mediaId = media[0].id
    }

    const fakeMessage = buildFakeMessage({
      attachments: media,
      chatId: chat.value.id,
      content: status,
      userId: currentUser.value.id,
      idempotencyKey,
    })

    pendingMessages.value.push(fakeMessage)
    pendingMessagesIndex.value.set(idempotencyKey, fakeMessage)

    return doSendMessage({
      params,
      retriesLeft: MAX_RETRIES,
    })
  }
  const doSendMessage = async ({ params, retriesLeft = MAX_RETRIES }) => {
    if (retriesLeft <= 0) return

    const handleMessageError = ({ idempotencyKey, isRetry }) => {
      const fakeMessage = pendingMessagesIndex.value.get(idempotencyKey)

      if (fakeMessage) {
        fakeMessage.error = true
        fakeMessage.pending = false
      }
    }

    try {
      const { data } = await sendChatMessage({
        ...params,
        credentials: useOAuthStore().token,
      })

      addMessages([{ ...data }])
    } catch (error) {
      if (
        error.name !== 'StatusCodeError' ||
        error.message === 'Failed to fetch'
      ) {
        throw error
      }
      console.error('Error sending message', error)

      handleMessageError({
        chatId: chat.value.id,
        idempotencyKey: params.idempotencyKey,
        isRetry: retriesLeft !== MAX_RETRIES,
      })

      const error5xx = error.statusCode >= 500 && error.statusCode < 600
      if (error5xx || error.message === 'Failed to fetch') {
        messageRetriers.set(
          params.idempotencyKey,
          setTimeout(
            () => {
              doSendMessage({
                params,
                retriesLeft: retriesLeft - 1,
              })
            },
            1000 * 2 ** (MAX_RETRIES - retriesLeft),
          ),
        )
      }
    }
  }

  // # Poll & Push
  const startFetching = (reason, isFirstFetch) => {
    console.debug('[Pleroma Chat] Started fetching', 'Reason:', reason)
    fetchOlder()
    fetcher.value = promiseInterval(() => fetchChat({ latest: true }), 5000)
    fetching.value = true
  }
  const stopFetching = (reason) => {
    console.debug('[Pleroma Chat] Stopped fetching', 'Reason:', reason)
    if (!fetching.value) return
    fetcher.value.stop()
    fetcher.value = null
    fetching.value = false
  }
  const onStreamConnect = () => {
    streaming.value = true
    stopFetching('Socket connected')
  }
  const onStreamDisconnect = (closeEvent) => {
    streaming.value = false
    startFetching('Socket disconnected')
  }
  const onChatUpdate = ({ data: { chatUpdate } }) => {
    const messages = [chatUpdate.lastMessage]
    addMessages(messages)
  }

  // # Actions
  const markAsRead = async () => {
    if (!maxId.value || document.hidden) {
      return
    }
    const lastReadId = maxId.value
    const isNewMessage = lastReadMessageId.value !== lastReadId

    if (!isNewMessage) return

    await readChat({
      id: chat.value.id,
      lastReadId,
      credentials: useOAuthStore().token,
    })

    useChatsStore().readChat(chat.value.id)
    lastReadMessageId.value = maxId.value
    newMessagesCount.value = 0
  }
  const deleteChatMessage = async ({ chatId, messageId }) => {
    await apiDeleteChatMessage({
      chatId,
      messageId,
      credentials: useOAuthStore().token,
    })

    messages.value = messages.value.filter((m) => m.id !== messageId)
    messagesIndex.delete(messageId)

    if (maxId.value === messageId) {
      const lastMessage = maxBy(messages.value, 'id')
      maxId.value = lastMessage.id
    }

    if (minId.value === messageId) {
      const firstMessage = minBy(messages.value, 'id')
      minId.value = firstMessage.id
    }
  }

  const fetchError = ref(null)
  const fetchChat = async ({ older = false, latest = false }) => {
    if (!older && streamingEnabled.value) {
      return
    }

    try {
      const { data: messages } = await chatMessages({
        id: chat.value.id,
        maxId: older ? minId.value : null,
        sinceId: older ? null : maxId.value,
        credentials: useOAuthStore().token,
      })

      addMessages(messages)
      fetchError.value = null
    } catch (e) {
      console.error('Error fetching chat', e)
      fetchError.value = e
    }
  }
  const fetchOlder = () => {
    fetchChat({ older: true })
  }

  // # Message list forming
  const addMessages = (newMessages) => {
    for (let message of newMessages) {
      // Clear any known pending messages
      if (message.idempotency_key) {
        if (pendingMessagesIndex.value.has(message.idempotency_key)) {
          pendingMessagesIndex.value.delete(message.idempotency_key)
          pendingMessages.value = pendingMessages.value.filter(
            ({ idempotency_key }) =>
              idempotency_key !== message.idempotency_key,
          )
        }
      }

      if (!minId.value || (!message.pending && message.id < minId.value)) {
        minId.value = message.id
      }

      if (!maxId.value || message.id > maxId.value) {
        maxId.value = message.id
      }
      const isConfirmation = (message) => {
        if (!message.idempotency_key) return
        return idempotencyKeyIndex.value.has(message.idempotency_key)
      }

      if (!messagesIndex.value.has(message.id) && !isConfirmation(message)) {
        if (lastReadMessageId < message.id) {
          newMessagesCount.value++
        }
        messagesIndex.value.set(message.id, message)
        messages.value.unshift(messagesIndex.value.get(message.id))
        idempotencyKeyIndex.value.set(message.idempotency_key, true)
      }
    }
  }
  const clear = () => {
    messages.value = messages.value.filter((m) => m.error)
    messagesIndex.value = messages.value.reduce((acc, m) => {
      acc.set(m.id, m)
      return acc
    }, new Map())
    newMessagesCount.value = 0
    lastReadMessageId.value = null
    minId.value = undefined
    maxId.value = undefined
  }

  const attachSocket = () => {
    const et = new EventTarget()
    const newSocket = {
      name: 'chatview',
      et,
    }

    et.addEventListener('pleroma:chat_update', onChatUpdate)
    et.addEventListener('open', onStreamConnect)
    et.addEventListener('close', onStreamDisconnect)

    socket.value = newSocket
    useStreamingStore().addSubscriber(socket.value)
  }
  const detachSocket = () => {
    const { et } = socket.value

    et.removeEventListener('pleroma:chat_update', onChatUpdate)
    et.removeEventListener('open', onStreamConnect)
    et.removeEventListener('close', onStreamDisconnect)

    useStreamingStore().removeSubscriber(socket.value)
  }
  const activate = async () => {
    try {
      attachSocket()
      const result = await getOrCreateChat({
        accountId: userId.value,
        credentials: useOAuthStore().token,
      })
      const { data } = result

      newMessagesCount.value = data.unread
      useUsersStore().addNewUsers({ ...result, data: data.account })
      data.account = useUsersStore().findUser(data.account.id)

      chat.value = data
      startFetching('Chat activated', true)
    } catch (e) {
      console.error('Error creating or getting a chat', e)
      error.value = e
    }
  }
  const deactivate = () => {
    if (fetching.value) {
      stopFetching('Chat deactivated')
    }
    clear()
    detachSocket()
  }

  const ready = computed(() => !!chat.value)
  const recipient = computed(() => chat.value?.account)

  return {
    activate,
    deactivate,
    sendMessage,
    newMessagesCount,
    markAsRead,
    deleteChatMessage,
    messages,
    pendingMessages,
    fetchError,
    fetchOlder,
    ready,
    recipient,
  }
}
