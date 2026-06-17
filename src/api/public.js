import { concat, each, last, map } from 'lodash'

import { paramsString, promisedRequest } from './helpers.js'

import {
  parseAttachment,
  parseChat,
  parseLinkHeaderPagination,
  parseNotification,
  parseSource,
  parseStatus,
  parseUser,
} from 'src/services/entity_normalizer/entity_normalizer.service.js'
import { RegistrationError, StatusCodeError } from 'src/services/errors/errors'

const SUGGESTIONS_URL = '/api/v1/suggestions'
/* eslint-env browser */
const MASTODON_LOGIN_URL = '/api/v1/accounts/verify_credentials'
const MASTODON_REGISTRATION_URL = '/api/v1/accounts'
const MASTODON_USER_FAVORITES_TIMELINE_URL = '/api/v1/favourites'
const MASTODON_USER_NOTIFICATIONS_URL = '/api/v1/notifications'
const MASTODON_FOLLOWING_URL = (
  id,
  { minId, maxId, sinceId, limit, withRelationships },
) =>
  `/api/v1/accounts/${id}/following${paramsString({ minId, maxId, sinceId, limit, withRelationships })}`
const MASTODON_FOLLOWERS_URL = (
  id,
  { minId, maxId, sinceId, limit, withRelationships },
) =>
  `/api/v1/accounts/${id}/followers${paramsString({ minId, maxId, sinceId, limit, withRelationships })}`
const MASTODON_USER_HOME_TIMELINE_URL = '/api/v1/timelines/home'
const MASTODON_LIST_TIMELINE_URL = (id) => `/api/v1/timelines/list/${id}`
const MASTODON_BOOKMARK_TIMELINE_URL = '/api/v1/bookmarks'
const MASTODON_DIRECT_MESSAGES_TIMELINE_URL = '/api/v1/timelines/direct'
const MASTODON_PUBLIC_TIMELINE = '/api/v1/timelines/public'
export const MASTODON_STATUS_URL = (id) => `/api/v1/statuses/${id}`
const MASTODON_STATUS_CONTEXT_URL = (id) => `/api/v1/statuses/${id}/context`
const MASTODON_STATUS_SOURCE_URL = (id) => `/api/v1/statuses/${id}/source`
const MASTODON_STATUS_HISTORY_URL = (id) => `/api/v1/statuses/${id}/history`
const MASTODON_USER_URL = '/api/v1/accounts'
const MASTODON_USER_LOOKUP_URL = '/api/v1/accounts/lookup'
const MASTODON_USER_TIMELINE_URL = (id) => `/api/v1/accounts/${id}/statuses`
const MASTODON_TAG_TIMELINE_URL = (tag) => `/api/v1/timelines/tag/${tag}`
const AKKOMA_BUBBLE_TIMELINE_URL = '/api/v1/timelines/bubble'
const MASTODON_POLL_URL = (id) => `/api/v1/polls/${id}`
const MASTODON_STATUS_FAVORITEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/favourited_by`
const MASTODON_STATUS_REBLOGGEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/reblogged_by`
const MASTODON_SEARCH_2 = '/api/v2/search'
const MASTODON_USER_SEARCH_URL = '/api/v1/accounts/search'
const MASTODON_STREAMING = '/api/v1/streaming'
const MASTODON_KNOWN_DOMAIN_LIST_URL = '/api/v1/instance/peers'
const MASTODON_ANNOUNCEMENTS_URL = '/api/v1/announcements'
const PLEROMA_EMOJI_REACTIONS_URL = (id) =>
  `/api/v1/pleroma/statuses/${id}/reactions`
const PLEROMA_SCROBBLES_URL = (id, { maxId, sinceId, minId, limit, offset }) =>
  `/api/v1/pleroma/accounts/${id}/scrobbles${paramsString({ maxId, sinceId, minId, limit, offset })}`
const PLEROMA_STATUS_QUOTES_URL = (id) =>
  `/api/v1/pleroma/statuses/${id}/quotes`
const PLEROMA_USER_FAVORITES_TIMELINE_URL = (id) =>
  `/api/v1/pleroma/accounts/${id}/favourites`

const EMOJI_PACKS_URL = (page, pageSize) =>
  `/api/v1/pleroma/emoji/packs${paramsString({ page, pageSize })}`

// Params needed:
// nickname
// email
// fullname
// password
// password_confirm
//
// Optional
// bio
// homepage
// location
// token
// language
export const register = ({ params, credentials }) => {
  const { nickname, ...rest } = params
  return promisedRequest({
    url: MASTODON_REGISTRATION_URL,
    method: 'POST',
    credentials,
    payload: {
      nickname,
      locale: 'en_US',
      agreement: true,
      ...rest,
    },
  })
}

export const getCaptcha = () =>
  promisedRequest({
    url: '/api/pleroma/captcha',
  })

export const fetchUser = ({ id, credentials }) =>
  promisedRequest({
    url: `${MASTODON_USER_URL}/${id}`,
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: parseUser(data) }))

export const fetchUserByName = ({ name, credentials }) =>
  promisedRequest({
    url: MASTODON_USER_LOOKUP_URL,
    credentials,
    params: { acct: name },
  })
    .then((data) => data.id)
    .catch((error) => {
      if (error && error.statusCode === 404) {
        // Either the backend does not support lookup endpoint,
        // or there is no user with such name. Fallback and treat name as id.
        return name
      } else {
        throw error
      }
    })
    .then((id) => fetchUser({ id, credentials }))

export const fetchFriends = ({ id, maxId, sinceId, limit = 20, credentials }) =>
  promisedRequest({
    url: MASTODON_FOLLOWING_URL(id, { maxId, sinceId, limit }),
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseUser) }))

export const fetchFollowers = ({
  id,
  maxId,
  sinceId,
  limit = 20,
  credentials,
}) =>
  promisedRequest({
    url: MASTODON_FOLLOWERS_URL(id, {
      maxId,
      sinceId,
      limit,
      withRelationships: true,
    }),
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseUser) }))

export const fetchConversation = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_CONTEXT_URL(id),
    credentials,
  })
    .then((result) => ({
      ...result,
      data: {
        ...result.data,
        ancestors: result.data.ancestors.map(parseStatus),
        descendants: result.data.descendants.map(parseStatus),
      },
    }))
    .catch((error) => {
      throw new Error('Error fetching timeline', error)
    })

export const fetchStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_URL(id),
    credentials,
  })
    .then(({ data, ...rest }) => ({ ...rest, data: parseStatus(data) }))
    .catch((error) => {
      throw new Error('Error fetching timeline', error)
    })

export const fetchStatusSource = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_SOURCE_URL(id),
    credentials,
  })
    .then(({ data, ...rest }) => ({ ...rest, data: parseSource(data) }))
    .catch((error) => {
      throw new Error('Error fetching timeline', error)
    })

export const fetchStatusHistory = ({ status, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_HISTORY_URL(status.id),
    credentials,
  }).then(({ data }) => {
    return [...data].reverse().map((item) => {
      item.originalStatus = status
      return parseStatus(item)
    })
  })

export const fetchTimeline = ({
  timeline,
  credentials,
  sinceId,
  minId,
  maxId,
  userId,
  listId,
  statusId,
  tag,
  withMuted,
  replyVisibility = 'all',
  includeTypes = [],
  bookmarkFolderId,
}) => {
  const timelineUrls = {
    public: MASTODON_PUBLIC_TIMELINE,
    friends: MASTODON_USER_HOME_TIMELINE_URL,
    dms: MASTODON_DIRECT_MESSAGES_TIMELINE_URL,
    notifications: MASTODON_USER_NOTIFICATIONS_URL,
    publicAndExternal: MASTODON_PUBLIC_TIMELINE,
    user: MASTODON_USER_TIMELINE_URL,
    media: MASTODON_USER_TIMELINE_URL,
    list: MASTODON_LIST_TIMELINE_URL,
    favorites: MASTODON_USER_FAVORITES_TIMELINE_URL,
    publicFavorites: PLEROMA_USER_FAVORITES_TIMELINE_URL,
    tag: MASTODON_TAG_TIMELINE_URL,
    bookmarks: MASTODON_BOOKMARK_TIMELINE_URL,
    quotes: PLEROMA_STATUS_QUOTES_URL,
    bubble: AKKOMA_BUBBLE_TIMELINE_URL,
  }

  const isNotifications = timeline === 'notifications'
  const params = {
    minId,
    sinceId,
    maxId,
    limit: 20,
  }

  let url = timelineUrls[timeline]

  if (timeline === 'favorites' && userId) {
    url = timelineUrls.publicFavorites(userId)
  }

  if (timeline === 'user' || timeline === 'media') {
    url = url(userId)
  }

  if (timeline === 'list') {
    url = url(listId)
  }

  if (timeline === 'quotes') {
    url = url(statusId)
  }

  if (tag) {
    url = url(tag)
  }

  if (timeline === 'media') {
    params.onlyMedia = 1
  }
  if (timeline === 'public') {
    params.local = true
  }
  if (timeline === 'public' || timeline === 'publicAndExternal') {
    params.onlyMedia = false
  }
  if (timeline !== 'favorites' && timeline !== 'bookmarks') {
    params.withMuted = withMuted
  }
  if (replyVisibility !== 'all') {
    params.replyVisibility = replyVisibility
  }
  if (includeTypes.size > 0) {
    params.includeTypes = includeTypes
  }
  if (timeline === 'bookmarks' && bookmarkFolderId) {
    params.folderId = bookmarkFolderId
  }

  return promisedRequest({
    url: url + paramsString(params),
    credentials,
  }).then(async (result) => {
    const pagination = parseLinkHeaderPagination(
      result.response.headers.get('Link'),
      {
        flakeId: timeline !== 'bookmarks' && timeline !== 'notifications',
      },
    )

    return {
      ...result,
      data: result.data.map(isNotifications ? parseNotification : parseStatus),
      pagination,
    }
  })
}

export const listEmojiPacks = ({ page, pageSize, credentials }) =>
  promisedRequest({
    url: EMOJI_PACKS_URL(page, pageSize),
  })

export const fetchPinnedStatuses = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_USER_TIMELINE_URL(id) + '?pinned=true',
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseStatus) }))

export const verifyCredentials = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_LOGIN_URL,
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: parseUser(data) }))

export const suggestions = ({ credentials }) =>
  promisedRequest({
    url: SUGGESTIONS_URL,
    credentials,
  })

export const fetchPoll = ({ pollId, credentials }) =>
  promisedRequest({
    url: MASTODON_POLL_URL(encodeURIComponent(pollId)),
    method: 'GET',
    credentials,
  })

export const fetchFavoritedByUsers = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_FAVORITEDBY_URL(id),
    method: 'GET',
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: parseUser(data) }))

export const fetchRebloggedByUsers = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_REBLOGGEDBY_URL(id),
    method: 'GET',
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: parseUser(data) }))

export const fetchEmojiReactions = ({ id, credentials }) =>
  promisedRequest({
    url: PLEROMA_EMOJI_REACTIONS_URL(id),
    credentials,
  }).then(({ data, ...rest }) => ({
    ...rest,
    data: data.map((r) => {
      r.accounts = r.accounts.map(parseUser)
      return r
    }),
  }))

export const searchUsers = ({ credentials, query }) =>
  promisedRequest({
    url: MASTODON_USER_SEARCH_URL,
    params: {
      q: query,
      resolve: true,
    },
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseUser) }))

export const search2 = ({
  credentials,
  q,
  resolve,
  limit,
  offset,
  following,
  type,
}) => {
  let url = MASTODON_SEARCH_2
  const params = []

  if (q) {
    params.push(['q', encodeURIComponent(q)])
  }

  if (resolve) {
    params.push(['resolve', resolve])
  }

  if (limit) {
    params.push(['limit', limit])
  }

  if (offset) {
    params.push(['offset', offset])
  }

  if (following) {
    params.push(['following', true])
  }

  if (type) {
    params.push(['type', type])
  }

  params.push(['with_relationships', true])

  const queryString = map(params, (param) => `${param[0]}=${param[1]}`).join(
    '&',
  )
  url += `?${queryString}`

  return promisedRequest({
    url,
    credentials,
  })
    .then(({ data, ...rest }) => {
      data.accounts = data.accounts.slice(0, limit).map((u) => parseUser(u))
      data.statuses = data.statuses.slice(0, limit).map((s) => parseStatus(s))
      return { ...rest, data }
    })
    .catch((error) => {
      throw new Error('Error fetching timeline', error)
    })
}

export const fetchKnownDomains = ({ credentials }) =>
  promisedRequest({ url: MASTODON_KNOWN_DOMAIN_LIST_URL, credentials })

export const getAnnouncements = ({ credentials }) =>
  promisedRequest({ url: MASTODON_ANNOUNCEMENTS_URL, credentials })

export const getMastodonSocketURI = (
  { credentials, stream, args = {} },
  base,
) => {
  const url = new URL(MASTODON_STREAMING, base)
  if (credentials) {
    url.searchParams.append('access_token', credentials)
  }
  if (stream) {
    url.searchParams.append('stream', stream)
  }
  Object.entries(args).forEach(([key, val]) => {
    url.searchParams.append(key, val)
  })
  return url
}

const MASTODON_STREAMING_EVENTS = new Set([
  'update',
  'notification',
  'delete',
  'filters_changed',
  'status.update',
])

const PLEROMA_STREAMING_EVENTS = new Set([
  'pleroma:chat_update',
  'pleroma:respond',
])

// A thin wrapper around WebSocket API that allows adding a pre-processor to it
// Uses EventTarget and a CustomEvent to proxy events
export const ProcessedWS = ({
  url,
  preprocessor = handleMastoWS,
  id = 'Unknown',
  credentials,
}) => {
  const eventTarget = new EventTarget()
  const socket = new WebSocket(url)
  if (!socket) throw new Error(`Failed to create socket ${id}`)
  const proxy = (original, eventName, processor = (a) => a) => {
    original.addEventListener(eventName, (eventData) => {
      eventTarget.dispatchEvent(
        new CustomEvent(eventName, { detail: processor(eventData) }),
      )
    })
  }
  socket.addEventListener('open', (wsEvent) => {
    console.debug(`[WS][${id}] Socket connected`, wsEvent)
    if (credentials) {
      socket.send(
        JSON.stringify({
          type: 'pleroma:authenticate',
          token: credentials,
        }),
      )
    }
  })
  socket.addEventListener('error', (wsEvent) => {
    console.debug(`[WS][${id}] Socket errored`, wsEvent)
  })
  socket.addEventListener('close', (wsEvent) => {
    console.debug(
      `[WS][${id}] Socket disconnected with code ${wsEvent.code}`,
      wsEvent,
    )
  })
  // Commented code reason: very spammy, uncomment to enable message debug logging
  /*
  socket.addEventListener('message', (wsEvent) => {
    console.debug(
      `[WS][${id}] Message received`,
      wsEvent
    )
  })
  /**/

  const onAuthenticated = () => {
    eventTarget.dispatchEvent(new CustomEvent('pleroma:authenticated'))
  }

  proxy(socket, 'open')
  proxy(socket, 'close')
  proxy(socket, 'message', (event) => preprocessor(event, { onAuthenticated }))
  proxy(socket, 'error')

  // 1000 = Normal Closure
  eventTarget.close = () => {
    socket.close(1000, 'Shutting down socket')
  }
  eventTarget.getState = () => socket.readyState
  eventTarget.subscribe = (stream, args = {}) => {
    console.debug(`[WS][${id}] Subscribing to stream ${stream} with args`, args)
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        stream,
        ...args,
      }),
    )
  }
  eventTarget.unsubscribe = (stream, args = {}) => {
    console.debug(
      `[WS][${id}] Unsubscribing from stream ${stream} with args`,
      args,
    )
    socket.send(
      JSON.stringify({
        type: 'unsubscribe',
        stream,
        ...args,
      }),
    )
  }

  return eventTarget
}

export const handleMastoWS = (
  wsEvent,
  {
    onAuthenticated = () => {
      /* no-op */
    },
  } = {},
) => {
  const { data } = wsEvent
  if (!data) return
  const parsedEvent = JSON.parse(data)
  const { event, payload } = parsedEvent
  if (
    MASTODON_STREAMING_EVENTS.has(event) ||
    PLEROMA_STREAMING_EVENTS.has(event)
  ) {
    // MastoBE and PleromaBE both send payload for delete as a PLAIN string
    if (event === 'delete') {
      return { event, id: payload }
    }
    const data = payload ? JSON.parse(payload) : null
    if (event === 'pleroma:respond') {
      if (data.type === 'pleroma:authenticate') {
        if (data.result === 'success') {
          console.debug('[WS] Successfully authenticated')
          onAuthenticated()
        } else {
          console.error('[WS] Unable to authenticate:', data.error)
          wsEvent.target.close()
        }
      }
      return null
    } else if (event === 'update') {
      return { event, status: parseStatus(data) }
    } else if (event === 'status.update') {
      return { event, status: parseStatus(data) }
    } else if (event === 'notification') {
      return { event, notification: parseNotification(data) }
    } else if (event === 'pleroma:chat_update') {
      return { event, chatUpdate: parseChat(data) }
    }
  } else {
    console.warn('Unknown event', wsEvent)
    return null
  }
}

export const WSConnectionStatus = Object.freeze({
  JOINED: 1,
  CLOSED: 2,
  ERROR: 3,
  DISABLED: 4,
  STARTING: 5,
  STARTING_INITIAL: 6,
})

export const fetchScrobbles = ({ accountId, limit = 1 }) =>
  promisedRequest({
    url: PLEROMA_SCROBBLES_URL(accountId, { limit }),
  })
