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

const MASTODON_SUGGESTIONS_URL = '/api/v1/suggestions'
const MASTODON_LOGIN_URL = '/api/v1/accounts/verify_credentials'
const MASTODON_REGISTRATION_URL = '/api/v1/accounts'
const MASTODON_PASSWORD_RESET_URL = ({ email }) =>
  `/auth/password${paramsString({ email })}`

const MASTODON_USER_NOTIFICATIONS_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  includeTypes,
  replyVisibility,
}) =>
  `/api/v1/notifications${paramsString({ minId, sinceId, maxId, limit, includeTypes, replyVisibility })}`
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

const MASTODON_USER_HOME_TIMELINE_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
}) =>
  `/api/v1/timelines/home${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const MASTODON_LIST_TIMELINE_URL = (
  id,
  { minId, sinceId, maxId, limit, replyVisibility },
) =>
  `/api/v1/timelines/list/${id}${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const MASTODON_DIRECT_MESSAGES_TIMELINE_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
}) =>
  `/api/v1/timelines/direct${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const MASTODON_PUBLIC_TIMELINE = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
  local,
  remote,
  onlyMedia,
}) =>
  `/api/v1/timelines/public${paramsString({ minId, sinceId, maxId, limit, replyVisibility, local, remote, onlyMedia })}`
const MASTODON_TAG_TIMELINE_URL = (
  tag,
  { minId, sinceId, maxId, limit, replyVisibility },
) =>
  `/api/v1/timelines/tag/${tag}${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const MASTODON_USER_TIMELINE_URL = (
  id,
  { minId, sinceId, maxId, limit, replyVisibility, pinned, onlyMedia },
) =>
  `/api/v1/accounts/${id}/statuses${paramsString({ minId, sinceId, maxId, limit, replyVisibility, pinned, onlyMedia })}`
const MASTODON_USER_FAVORITES_TIMELINE_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
}) =>
  `/api/v1/favourites${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const MASTODON_BOOKMARK_TIMELINE_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
  folderId,
}) =>
  `/api/v1/bookmarks${paramsString({ minId, sinceId, maxId, limit, replyVisibility, folderId })}`
const PLEROMA_STATUS_QUOTES_URL = (
  id,
  { minId, sinceId, maxId, limit, replyVisibility },
) =>
  `/api/v1/pleroma/statuses/${id}/quotes${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const PLEROMA_USER_FAVORITES_TIMELINE_URL = (
  id,
  { minId, sinceId, maxId, limit, replyVisibility },
) =>
  `/api/v1/pleroma/accounts/${id}/favourites${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`
const AKKOMA_BUBBLE_TIMELINE_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  replyVisibility,
}) =>
  `/api/v1/timelines/bubble${paramsString({ minId, sinceId, maxId, limit, replyVisibility })}`

export const MASTODON_STATUS_URL = (id) => `/api/v1/statuses/${id}`
const MASTODON_STATUS_CONTEXT_URL = (id) => `/api/v1/statuses/${id}/context`
const MASTODON_STATUS_SOURCE_URL = (id) => `/api/v1/statuses/${id}/source`
const MASTODON_STATUS_HISTORY_URL = (id) => `/api/v1/statuses/${id}/history`
const MASTODON_USER_URL = '/api/v1/accounts'
const MASTODON_USER_LOOKUP_URL = ({ acct }) => `/api/v1/accounts/lookup${paramsString({ acct })}`
const MASTODON_POLL_URL = (id = '') => `/api/v1/polls/${id}`
const MASTODON_STATUS_FAVORITEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/favourited_by`
const MASTODON_STATUS_REBLOGGEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/reblogged_by`
const MASTODON_SEARCH_2 = ({
  q,
  resolve,
  limit,
  offset,
  following,
  type,
  withRelationships,
  accountId,
  excludeUnreviewed,
}) =>
  `/api/v2/search${paramsString({ q, resolve, limit, offset, following, type, withRelationships, accountId, excludeUnreviewed })}`
const MASTODON_USER_SEARCH_URL = ({ q, resolve }) =>
  `/api/v1/accounts/search${paramsString({ q, resolve })}`
const MASTODON_STREAMING = ({ accessToken, stream }) =>
  `/api/v1/streaming${paramsString({ accessToken, stream })}`
const MASTODON_KNOWN_DOMAIN_LIST_URL = '/api/v1/instance/peers'
const PLEROMA_EMOJI_REACTIONS_URL = (id) =>
  `/api/v1/pleroma/statuses/${id}/reactions`
const PLEROMA_SCROBBLES_URL = (id, { maxId, sinceId, minId, limit, offset }) =>
  `/api/v1/pleroma/accounts/${id}/scrobbles${paramsString({ maxId, sinceId, minId, limit, offset })}`

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
    url: MASTODON_USER_LOOKUP_URL({ acct: name }),
    credentials,
  })
    .then(({ data }) => data.id)
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
  }).then(({ data, ...rest }) => {
    return [...data].reverse().map((item) => {
      item.originalStatus = status
      return { ...rest, data: parseStatus(item) }
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
    friends: MASTODON_USER_HOME_TIMELINE_URL,
    public: MASTODON_PUBLIC_TIMELINE,
    publicAndExternal: MASTODON_PUBLIC_TIMELINE,
    dms: MASTODON_DIRECT_MESSAGES_TIMELINE_URL,
    user: MASTODON_USER_TIMELINE_URL,
    media: MASTODON_USER_TIMELINE_URL,
    list: MASTODON_LIST_TIMELINE_URL,
    favorites: MASTODON_USER_FAVORITES_TIMELINE_URL,
    publicFavorites: PLEROMA_USER_FAVORITES_TIMELINE_URL,
    bookmarks: MASTODON_BOOKMARK_TIMELINE_URL,
    bubble: AKKOMA_BUBBLE_TIMELINE_URL,
    tag: MASTODON_TAG_TIMELINE_URL,
    quotes: PLEROMA_STATUS_QUOTES_URL,

    notifications: MASTODON_USER_NOTIFICATIONS_URL,
  }
  const urlFunc = timelineUrls[timeline]

  const twoArgs = new Set([
    'user',
    'media',
    'list',
    'publicFavorites',
    'tag',
    'quotes',
  ])

  const params = {
    minId,
    sinceId,
    maxId,
    limit: 20,
  }

  const id = (() => {
    switch (timeline) {
      case 'user':
      case 'media':
        return userId
      case 'list':
        return listId
      case 'quotes':
        return statusId
      case 'tag':
        return tag
    }
  })()

  const isNotifications = timeline === 'notifications'

  if (timeline === 'media') {
    params.onlyMedia = true
  }
  if (timeline === 'public') {
    params.local = true
  }
  if (timeline !== 'favorites' && timeline !== 'bookmarks') {
    params.withMuted = withMuted
  }
  if (replyVisibility !== 'all') {
    params.replyVisibility = replyVisibility
  }
  if (timeline === 'bookmarks' && bookmarkFolderId) {
    params.folderId = bookmarkFolderId
  }

  if (isNotifications && includeTypes.length > 0) {
    params.includeTypes = includeTypes
  }

  const url = twoArgs.has(timeline) ? urlFunc(id, params) : urlFunc(params)
  return promisedRequest({ url, credentials }).then((result) => {
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
    url: MASTODON_USER_TIMELINE_URL(id, { pinned: true }),
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseStatus) }))

export const verifyCredentials = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_LOGIN_URL,
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: parseUser(data) }))

export const resetPassword = ({ email }) => {
  return promisedRequest({
    url: MASTODON_PASSWORD_RESET_URL({ email }),
    method: 'POST',
  })
}

export const suggestions = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_SUGGESTIONS_URL,
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
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseUser) }))

export const fetchRebloggedByUsers = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_REBLOGGEDBY_URL(id),
    method: 'GET',
    credentials,
  }).then(({ data, ...rest }) => ({ ...rest, data: data.map(parseUser) }))

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
    url: MASTODON_USER_SEARCH_URL({ q: query, resolve: true }),
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
  return promisedRequest({
    url: MASTODON_SEARCH_2({
      q,
      resolve,
      limit,
      offset,
      following,
      type,
      withRelationships: true,
    }),
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

export const getMastodonSocketURI = ({ credentials, stream }, base) => {
  return base + MASTODON_STREAMING({ accessToken: credentials, stream })
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
