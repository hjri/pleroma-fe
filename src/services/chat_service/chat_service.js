import { maxBy, minBy, orderBy, sortBy, uniqueId } from 'lodash'

const empty = (chatId) => {
  return {
    idIndex: {},
    idempotencyKeyIndex: {},
    messages: [],
    newMessageCount: 0,
    lastSeenMessageId: '0',
    chatId,
    minId: undefined,
    maxId: undefined,
  }
}

const clear = (storage) => {
  const failedMessageIds = []

  for (const message of storage.messages) {
    if (message.error) {
      failedMessageIds.push(message.id)
    } else {
      delete storage.idIndex[message.id]
      delete storage.idempotencyKeyIndex[message.idempotency_key]
    }
  }

  storage.messages = storage.messages.filter((m) =>
    failedMessageIds.includes(m.id),
  )
  storage.newMessageCount = 0
  storage.lastSeenMessageId = '0'
  storage.minId = undefined
  storage.maxId = undefined
}

const deleteMessage = (storage, messageId) => {
  if (!storage) {
    return
  }
  storage.messages = storage.messages.filter((m) => m.id !== messageId)
  delete storage.idIndex[messageId]

  if (storage.maxId === messageId) {
    const lastMessage = maxBy(storage.messages, 'id')
    storage.maxId = lastMessage.id
  }

  if (storage.minId === messageId) {
    const firstMessage = minBy(storage.messages, 'id')
    storage.minId = firstMessage.id
  }
}

const cullOlderMessages = (storage) => {
  const maxIndex = storage.messages.length
  const minIndex = maxIndex - 50
  if (maxIndex <= 50) return

  storage.messages = sortBy(storage.messages, ['id'])
  storage.minId = storage.messages[minIndex].id
  for (const message of storage.messages) {
    if (message.id < storage.minId) {
      delete storage.idIndex[message.id]
      delete storage.idempotencyKeyIndex[message.idempotency_key]
    }
  }
  storage.messages = storage.messages.slice(minIndex, maxIndex)
}

const handleMessageError = (storage, fakeId, isRetry) => {
  if (!storage) {
    return
  }
  const fakeMessage = storage.idIndex[fakeId]
  if (fakeMessage) {
    fakeMessage.error = true
    fakeMessage.pending = false
    if (!isRetry) {
      // Ensure the failed message doesn't stay at the bottom of the list.
      const lastPersistedMessage = orderBy(
        storage.messages,
        ['pending', 'id'],
        ['asc', 'desc'],
      )[0]
      if (lastPersistedMessage) {
        const oldId = fakeMessage.id
        fakeMessage.id = `${lastPersistedMessage.id}-${new Date().getTime()}`
        storage.idIndex[fakeMessage.id] = fakeMessage
        delete storage.idIndex[oldId]
      }
    }
  }
}

const add = (storage, { messages: newMessages, updateMaxId = true }) => {
  if (!storage) {
    return
  }
  for (let i = 0; i < newMessages.length; i++) {
    const message = newMessages[i]

    // sanity check
    if (message.chat_id !== storage.chatId) {
      return
    }

    if (message.fakeId) {
      const fakeMessage = storage.idIndex[message.fakeId]
      if (fakeMessage) {
        // In case the same id exists (chat update before POST response)
        // make sure to remove the older duplicate message.
        if (storage.idIndex[message.id]) {
          delete storage.idIndex[message.id]
          storage.messages = storage.messages.filter(
            (msg) => msg.id !== message.id,
          )
        }
        Object.assign(fakeMessage, message, { error: false })
        delete fakeMessage.fakeId
        storage.idIndex[fakeMessage.id] = fakeMessage
        delete storage.idIndex[message.fakeId]

        return
      }
    }

    if (!storage.minId || (!message.pending && message.id < storage.minId)) {
      storage.minId = message.id
    }

    if (!storage.maxId || message.id > storage.maxId) {
      if (updateMaxId) {
        storage.maxId = message.id
      }
    }

    if (!storage.idIndex[message.id] && !isConfirmation(storage, message)) {
      if (storage.lastSeenMessageId < message.id) {
        storage.newMessageCount++
      }
      storage.idIndex[message.id] = message
      storage.messages.push(storage.idIndex[message.id])
      storage.idempotencyKeyIndex[message.idempotency_key] = true
    }
  }
}

const isConfirmation = (storage, message) => {
  if (!message.idempotency_key) return
  return storage.idempotencyKeyIndex[message.idempotency_key]
}

const resetNewMessageCount = (storage) => {
  if (!storage) {
    return
  }
  storage.newMessageCount = 0
  storage.lastSeenMessageId = storage.maxId
}

const ChatService = {
  add,
  empty,
  deleteMessage,
  cullOlderMessages,
  resetNewMessageCount,
  clear,
  handleMessageError,
}

export default ChatService
