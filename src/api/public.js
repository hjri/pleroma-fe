import { paramsString, promisedRequest } from './helpers.js'
import { MASTODON_USER_TIMELINE_URL } from './timelines.js'

import {
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

export const MASTODON_STATUS_URL = (id) => `/api/v1/statuses/${id}`
const MASTODON_STATUS_CONTEXT_URL = (id) => `/api/v1/statuses/${id}/context`
const MASTODON_STATUS_SOURCE_URL = (id) => `/api/v1/statuses/${id}/source`
const MASTODON_STATUS_HISTORY_URL = (id) => `/api/v1/statuses/${id}/history`
const MASTODON_USER_URL = '/api/v1/accounts'
const MASTODON_USER_LOOKUP_URL = ({ acct }) =>
  `/api/v1/accounts/lookup${paramsString({ acct })}`
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

export const fetchScrobbles = ({ accountId, limit = 1 }) =>
  promisedRequest({
    url: PLEROMA_SCROBBLES_URL(accountId, { limit }),
  })
