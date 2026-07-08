import { maxBy, minBy, orderBy, sortBy, uniqueId } from 'lodash'

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


const resetNewMessageCount = (storage) => {
  if (!storage) {
    return
  }
  storage.newMessageCount = 0
  storage.lastSeenMessageId = storage.maxId
}

const ChatService = {
  deleteMessage,
  resetNewMessageCount,
  handleMessageError,
}

export default ChatService
