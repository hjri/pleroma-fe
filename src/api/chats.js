import { paramsString, promisedRequest } from './helpers.js'

import {
  parseChat,
  parseChatMessage,
} from 'src/services/entity_normalizer/entity_normalizer.service.js'

const PLEROMA_CHATS_URL = '/api/v1/pleroma/chats'
const PLEROMA_CHAT_URL = (id) => `/api/v1/pleroma/chats/by-account-id/${id}`
const PLEROMA_CHAT_MESSAGES_URL = (id, { maxId, sinceId, limit } = {}) =>
  `/api/v1/pleroma/chats/${id}/messages${paramsString({ maxId, sinceId, limit })}`
const PLEROMA_CHAT_READ_URL = (id) => `/api/v1/pleroma/chats/${id}/read`
const PLEROMA_DELETE_CHAT_MESSAGE_URL = (chatId, messageId) =>
  `/api/v1/pleroma/chats/${chatId}/messages/${messageId}`

export const chats = ({ credentials }) =>
  promisedRequest({
    url: PLEROMA_CHATS_URL,
    credentials,
  }).then(({ data }) => ({
    data: data.map(parseChat).filter(Boolean),
  }))

export const getOrCreateChat = ({ accountId, credentials }) =>
  promisedRequest({
    url: PLEROMA_CHAT_URL(accountId),
    method: 'POST',
    credentials,
  }).then(({ data }) => ({ data: parseChat(data) }))

export const chatMessages = ({
  id,
  credentials,
  maxId,
  sinceId,
  limit = 20,
}) => {
  return promisedRequest({
    url: PLEROMA_CHAT_MESSAGES_URL(id, { maxId, sinceId, limit }),
    method: 'GET',
    credentials,
  }).then(({ data }) => ({
    data: data.map(parseChatMessage).filter(Boolean),
  }))
}

export const sendChatMessage = ({
  id,
  content,
  mediaId = null,
  idempotencyKey,
  credentials,
}) => {
  const payload = {
    content,
  }

  if (mediaId) {
    payload.media_id = mediaId
  }

  const headers = {}

  if (idempotencyKey) {
    headers['idempotency-key'] = idempotencyKey
  }

  return promisedRequest({
    url: PLEROMA_CHAT_MESSAGES_URL(id),
    method: 'POST',
    payload,
    credentials,
    headers,
  }).then(({ data }) => ({
    data: parseChatMessage(data),
  }))
}

export const readChat = ({ id, lastReadId, credentials }) =>
  promisedRequest({
    url: PLEROMA_CHAT_READ_URL(id),
    method: 'POST',
    payload: {
      last_read_id: lastReadId,
    },
    credentials,
  })

export const deleteChatMessage = ({ chatId, messageId, credentials }) =>
  promisedRequest({
    url: PLEROMA_DELETE_CHAT_MESSAGE_URL(chatId, messageId),
    method: 'DELETE',
    credentials,
  })
