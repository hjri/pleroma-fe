import { concat, each, last, map } from 'lodash'

import {
  parseAttachment,
  parseChat,
  parseLinkHeaderPagination,
  parseNotification,
  parseSource,
  parseStatus,
  parseUser,
} from '../entity_normalizer/entity_normalizer.service.js'
import { promisedRequest } from './helpers.js'

import { RegistrationError, StatusCodeError } from 'src/services/errors/errors'

/* eslint-env browser */
const MUTES_IMPORT_URL = '/api/pleroma/mutes_import'
const BLOCKS_IMPORT_URL = '/api/pleroma/blocks_import'
const FOLLOW_IMPORT_URL = '/api/pleroma/follow_import'
const DELETE_ACCOUNT_URL = '/api/pleroma/delete_account'
const CHANGE_EMAIL_URL = '/api/pleroma/change_email'
const CHANGE_PASSWORD_URL = '/api/pleroma/change_password'
const MOVE_ACCOUNT_URL = '/api/pleroma/move_account'
const ALIASES_URL = '/api/pleroma/aliases'
const SUGGESTIONS_URL = '/api/v1/suggestions'
const NOTIFICATION_SETTINGS_URL = '/api/pleroma/notification_settings'
const NOTIFICATION_READ_URL = '/api/v1/pleroma/notifications/read'

const MFA_SETTINGS_URL = '/api/pleroma/accounts/mfa'
const MFA_BACKUP_CODES_URL = '/api/pleroma/accounts/mfa/backup_codes'

const MFA_SETUP_OTP_URL = '/api/pleroma/accounts/mfa/setup/totp'
const MFA_CONFIRM_OTP_URL = '/api/pleroma/accounts/mfa/confirm/totp'
const MFA_DISABLE_OTP_URL = '/api/pleroma/accounts/mfa/totp'

const MASTODON_LOGIN_URL = '/api/v1/accounts/verify_credentials'
const MASTODON_REGISTRATION_URL = '/api/v1/accounts'
const MASTODON_USER_FAVORITES_TIMELINE_URL = '/api/v1/favourites'
const MASTODON_USER_NOTIFICATIONS_URL = '/api/v1/notifications'
const MASTODON_DISMISS_NOTIFICATION_URL = (id) =>
  `/api/v1/notifications/${id}/dismiss`
const MASTODON_FAVORITE_URL = (id) => `/api/v1/statuses/${id}/favourite`
const MASTODON_UNFAVORITE_URL = (id) => `/api/v1/statuses/${id}/unfavourite`
const MASTODON_RETWEET_URL = (id) => `/api/v1/statuses/${id}/reblog`
const MASTODON_UNRETWEET_URL = (id) => `/api/v1/statuses/${id}/unreblog`
const MASTODON_DELETE_URL = (id) => `/api/v1/statuses/${id}`
const MASTODON_FOLLOW_URL = (id) => `/api/v1/accounts/${id}/follow`
const MASTODON_UNFOLLOW_URL = (id) => `/api/v1/accounts/${id}/unfollow`
const MASTODON_FOLLOWING_URL = (id) => `/api/v1/accounts/${id}/following`
const MASTODON_FOLLOWERS_URL = (id) => `/api/v1/accounts/${id}/followers`
const MASTODON_FOLLOW_REQUESTS_URL = '/api/v1/follow_requests'
const MASTODON_APPROVE_USER_URL = (id) =>
  `/api/v1/follow_requests/${id}/authorize`
const MASTODON_DENY_USER_URL = (id) => `/api/v1/follow_requests/${id}/reject`
const MASTODON_DIRECT_MESSAGES_TIMELINE_URL = '/api/v1/timelines/direct'
const MASTODON_PUBLIC_TIMELINE = '/api/v1/timelines/public'
const MASTODON_USER_HOME_TIMELINE_URL = '/api/v1/timelines/home'
const MASTODON_STATUS_URL = (id) => `/api/v1/statuses/${id}`
const MASTODON_STATUS_CONTEXT_URL = (id) => `/api/v1/statuses/${id}/context`
const MASTODON_STATUS_SOURCE_URL = (id) => `/api/v1/statuses/${id}/source`
const MASTODON_STATUS_HISTORY_URL = (id) => `/api/v1/statuses/${id}/history`
const MASTODON_USER_URL = '/api/v1/accounts'
const MASTODON_USER_LOOKUP_URL = '/api/v1/accounts/lookup'
const MASTODON_USER_RELATIONSHIPS_URL = '/api/v1/accounts/relationships'
const MASTODON_USER_TIMELINE_URL = (id) => `/api/v1/accounts/${id}/statuses`
const MASTODON_USER_IN_LISTS = (id) => `/api/v1/accounts/${id}/lists`
const MASTODON_LIST_URL = (id) => `/api/v1/lists/${id}`
const MASTODON_LIST_TIMELINE_URL = (id) => `/api/v1/timelines/list/${id}`
const MASTODON_LIST_ACCOUNTS_URL = (id) => `/api/v1/lists/${id}/accounts`
const MASTODON_TAG_TIMELINE_URL = (tag) => `/api/v1/timelines/tag/${tag}`
const MASTODON_BOOKMARK_TIMELINE_URL = '/api/v1/bookmarks'
const AKKOMA_BUBBLE_TIMELINE_URL = '/api/v1/timelines/bubble'
const MASTODON_USER_BLOCKS_URL = '/api/v1/blocks/'
const MASTODON_USER_MUTES_URL = '/api/v1/mutes/'
const MASTODON_BLOCK_USER_URL = (id) => `/api/v1/accounts/${id}/block`
const MASTODON_UNBLOCK_USER_URL = (id) => `/api/v1/accounts/${id}/unblock`
const MASTODON_MUTE_USER_URL = (id) => `/api/v1/accounts/${id}/mute`
const MASTODON_UNMUTE_USER_URL = (id) => `/api/v1/accounts/${id}/unmute`
const MASTODON_REMOVE_USER_FROM_FOLLOWERS = (id) =>
  `/api/v1/accounts/${id}/remove_from_followers`
const MASTODON_USER_NOTE_URL = (id) => `/api/v1/accounts/${id}/note`
const MASTODON_BOOKMARK_STATUS_URL = (id) => `/api/v1/statuses/${id}/bookmark`
const MASTODON_UNBOOKMARK_STATUS_URL = (id) =>
  `/api/v1/statuses/${id}/unbookmark`
const MASTODON_POST_STATUS_URL = '/api/v1/statuses'
const MASTODON_MEDIA_UPLOAD_URL = '/api/v1/media'
const MASTODON_VOTE_URL = (id) => `/api/v1/polls/${id}/votes`
const MASTODON_POLL_URL = (id) => `/api/v1/polls/${id}`
const MASTODON_STATUS_FAVORITEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/favourited_by`
const MASTODON_STATUS_REBLOGGEDBY_URL = (id) =>
  `/api/v1/statuses/${id}/reblogged_by`
const MASTODON_PROFILE_UPDATE_URL = '/api/v1/accounts/update_credentials'
const MASTODON_REPORT_USER_URL = '/api/v1/reports'
const MASTODON_PIN_OWN_STATUS = (id) => `/api/v1/statuses/${id}/pin`
const MASTODON_UNPIN_OWN_STATUS = (id) => `/api/v1/statuses/${id}/unpin`
const MASTODON_MUTE_CONVERSATION = (id) => `/api/v1/statuses/${id}/mute`
const MASTODON_UNMUTE_CONVERSATION = (id) => `/api/v1/statuses/${id}/unmute`
const MASTODON_SEARCH_2 = '/api/v2/search'
const MASTODON_USER_SEARCH_URL = '/api/v1/accounts/search'
const MASTODON_DOMAIN_BLOCKS_URL = '/api/v1/domain_blocks'
const MASTODON_LISTS_URL = '/api/v1/lists'
const MASTODON_STREAMING = '/api/v1/streaming'
const MASTODON_KNOWN_DOMAIN_LIST_URL = '/api/v1/instance/peers'
const MASTODON_ANNOUNCEMENTS_URL = '/api/v1/announcements'
const MASTODON_ANNOUNCEMENTS_DISMISS_URL = (id) =>
  `/api/v1/announcements/${id}/dismiss`
const PLEROMA_EMOJI_REACTIONS_URL = (id) =>
  `/api/v1/pleroma/statuses/${id}/reactions`
const PLEROMA_EMOJI_REACT_URL = (id, emoji) =>
  `/api/v1/pleroma/statuses/${id}/reactions/${emoji}`
const PLEROMA_EMOJI_UNREACT_URL = (id, emoji) =>
  `/api/v1/pleroma/statuses/${id}/reactions/${emoji}`
const PLEROMA_CHATS_URL = '/api/v1/pleroma/chats'
const PLEROMA_CHAT_URL = (id) => `/api/v1/pleroma/chats/by-account-id/${id}`
const PLEROMA_CHAT_MESSAGES_URL = (id) => `/api/v1/pleroma/chats/${id}/messages`
const PLEROMA_CHAT_READ_URL = (id) => `/api/v1/pleroma/chats/${id}/read`
const PLEROMA_DELETE_CHAT_MESSAGE_URL = (chatId, messageId) =>
  `/api/v1/pleroma/chats/${chatId}/messages/${messageId}`
const PLEROMA_BACKUP_URL = '/api/v1/pleroma/backups'
const PLEROMA_SCROBBLES_URL = (id) => `/api/v1/pleroma/accounts/${id}/scrobbles`
const PLEROMA_STATUS_QUOTES_URL = (id) =>
  `/api/v1/pleroma/statuses/${id}/quotes`
const PLEROMA_USER_FAVORITES_TIMELINE_URL = (id) =>
  `/api/v1/pleroma/accounts/${id}/favourites`
const PLEROMA_BOOKMARK_FOLDERS_URL = '/api/v1/pleroma/bookmark_folders'
const PLEROMA_BOOKMARK_FOLDER_URL = (id) =>
  `/api/v1/pleroma/bookmark_folders/${id}`
export const updateNotificationSettings = ({ credentials, settings }) => {
  const form = new FormData()

  each(settings, (value, key) => {
    form.append(key, value)
  })

  return promisedRequest({
    url: `${NOTIFICATION_SETTINGS_URL}?${new URLSearchParams(settings)}`,
    credentials,
    method: 'PUT',
    formData: form,
  })
}

export const updateProfileImages = ({
  credentials,
  avatar = null,
  avatarName = null,
  banner = null,
  background = null,
}) => {
  const form = new FormData()
  if (avatar !== null) {
    if (avatarName !== null) {
      form.append('avatar', avatar, avatarName)
    } else {
      form.append('avatar', avatar)
    }
  }
  if (banner !== null) form.append('header', banner)
  if (background !== null) form.append('pleroma_background_image', background)
  return promisedRequest({
    url: MASTODON_PROFILE_UPDATE_URL,
    credentials,
    method: 'PATCH',
    formData: form,
  }).then((data) => {
    if (data.error) {
      throw new Error(data.error)
    }
    return parseUser(data)
  })
}

export const updateProfile = ({ credentials, params }) => {
  const formData = new FormData()

  for (const name in params) {
    if (name === 'fields_attributes') {
      params[name].forEach((param, i) => {
        formData.append(name + `[${i}][name]`, param.name)
        formData.append(name + `[${i}][value]`, param.value)
      })
    } else {
      if (typeof params[name] === 'object') {
        console.warn(
          'Object detected in updateProfile API call. This will not work, use updateProfileJSON instead.',
        )
        console.warn('Object:\n' + JSON.stringify(params[name], null, 2))
      }
      formData.append(name, params[name])
    }
  }

  return promisedRequest({
    url: MASTODON_PROFILE_UPDATE_URL,
    credentials,
    method: 'PATCH',
    formData,
  }).then((data) => parseUser(data))
}

export const updateProfileJSON = ({ credentials, params }) =>
  promisedRequest({
    url: MASTODON_PROFILE_UPDATE_URL,
    credentials,
    payload: params,
    method: 'PATCH',
  }).then((data) => parseUser(data))

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

export const followUser = ({ id, credentials, ...options }) => {
  const form = {}

  if (options.reblogs !== undefined) {
    form.reblogs = options.reblogs
  }

  if (options.notify !== undefined) {
    form.notify = options.notify
  }

  return promisedRequest({
    url: MASTODON_FOLLOW_URL(id),
    formData: form,
    credentials,
    method: 'POST',
  })
}

export const unfollowUser = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNFOLLOW_URL(id),
    credentials,
    method: 'POST',
  })

export const fetchUserInLists = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_USER_IN_LISTS(id),
    credentials,
  })

export const pinOwnStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_PIN_OWN_STATUS(id),
    credentials,
    method: 'POST',
  }).then((data) => parseStatus(data))

export const unpinOwnStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNPIN_OWN_STATUS(id),
    credentials,
    method: 'POST',
  }).then((data) => parseStatus(data))

export const muteConversation = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_MUTE_CONVERSATION(id),
    credentials,
    method: 'POST',
  }).then((data) => parseStatus(data))

export const unmuteConversation = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNMUTE_CONVERSATION(id),
    credentials,
    method: 'POST',
  }).then((data) => parseStatus(data))

export const blockUser = ({ id, expiresIn, credentials }) => {
  const payload = {}
  if (expiresIn) {
    payload.duration = expiresIn
  }

  return promisedRequest({
    url: MASTODON_BLOCK_USER_URL(id),
    credentials,
    method: 'POST',
    payload,
  })
}

export const unblockUser = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNBLOCK_USER_URL(id),
    credentials,
    method: 'POST',
  })

export const removeUserFromFollowers = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_REMOVE_USER_FROM_FOLLOWERS(id),
    credentials,
    method: 'POST',
  })

export const editUserNote = ({ id, credentials, comment }) =>
  promisedRequest({
    url: MASTODON_USER_NOTE_URL(id),
    credentials,
    payload: {
      comment,
    },
    method: 'POST',
  })

export const approveUser = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_APPROVE_USER_URL(id),
    credentials,
    method: 'POST',
  })

export const denyUser = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_DENY_USER_URL(id),
    credentials,
    method: 'POST',
  })

export const fetchUser = ({ id, credentials }) =>
  promisedRequest({
    url: `${MASTODON_USER_URL}/${id}`,
    credentials,
  }).then((data) => parseUser(data))

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

export const fetchUserRelationship = ({ id, credentials }) =>
  promisedRequest({
    url: `${MASTODON_USER_RELATIONSHIPS_URL}/?id=${id}`,
    credentials,
  })

export const fetchFriends = ({
  id,
  maxId,
  sinceId,
  limit = 20,
  credentials,
}) => {
  let url = MASTODON_FOLLOWING_URL(id)
  const args = [
    maxId && `max_id=${maxId}`,
    sinceId && `since_id=${sinceId}`,
    limit && `limit=${limit}`,
    'with_relationships=true',
  ]
    .filter((_) => _)
    .join('&')

  url = url + (args ? '?' + args : '')
  return promisedRequest({
    url,
    credentials,
  }).then((data) => data.map(parseUser))
}

export const exportFriends = ({ id, credentials }) => {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO refactor this
  return new Promise(async (resolve, reject) => {
    try {
      let friends = []
      let more = true
      while (more) {
        const maxId = friends.length > 0 ? last(friends).id : undefined
        const users = await fetchFriends({ id, maxId, credentials })
        friends = concat(friends, users)
        if (users.length === 0) {
          more = false
        }
      }
      resolve(friends)
    } catch (err) {
      reject(err)
    }
  })
}

export const fetchFollowers = ({
  id,
  maxId,
  sinceId,
  limit = 20,
  credentials,
}) => {
  let url = MASTODON_FOLLOWERS_URL(id)
  const args = [
    maxId && `max_id=${maxId}`,
    sinceId && `since_id=${sinceId}`,
    limit && `limit=${limit}`,
    'with_relationships=true',
  ]
    .filter((_) => _)
    .join('&')

  url += args ? '?' + args : ''
  return promisedRequest({
    url,
    credentials,
  }).then((data) => data.map(parseUser))
}

export const fetchFollowRequests = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_FOLLOW_REQUESTS_URL,
    credentials,
  }).then((data) => data.map(parseUser))

export const fetchLists = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_LISTS_URL,
    credentials,
  })

export const createList = ({ title, credentials }) =>
  promisedRequest({
    url: MASTODON_LISTS_URL,
    credentials,
    method: 'POST',
    payload: { title },
  })

export const getList = ({ listId, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_URL(listId),
    credentials,
  })

export const updateList = ({ listId, title, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_URL(listId),

    credentials,
    method: 'PUT',
    payload: { title },
  })

export const getListAccounts = ({ listId, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_ACCOUNTS_URL(listId),
    credentials,
  }).then((data) => data.map(({ id }) => id))

export const addAccountsToList = ({ listId, accountIds, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_ACCOUNTS_URL(listId),
    credentials,
    method: 'POST',
    payload: { account_ids: accountIds },
  })

export const removeAccountsFromList = ({ listId, accountIds, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_ACCOUNTS_URL(listId),
    credentials,
    method: 'DELETE',
    payload: { account_ids: accountIds },
  })

export const deleteList = ({ listId, credentials }) =>
  promisedRequest({
    url: MASTODON_LIST_URL(listId),
    method: 'DELETE',
    credentials,
  })

export const fetchConversation = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_CONTEXT_URL(id),
    credentials,
  })
    .then((data) => {
      if (data.ok) {
        return data
      }
      throw new Error('Error fetching timeline', data)
    })
    .then(({ ancestors, descendants }) => ({
      ancestors: ancestors.map(parseStatus),
      descendants: descendants.map(parseStatus),
    }))

export const fetchStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_URL(id),
    credentials,
  })
    .then((data) => {
      if (data.ok) {
        return data
      }
      throw new Error('Error fetching timeline', { cause: data })
    })
    .then((data) => parseStatus(data))

export const fetchStatusSource = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_SOURCE_URL(id),
    credentials,
  })
    .then((data) => {
      if (data.ok) {
        return data
      }
      throw new Error('Error fetching source', { cause: data })
    })
    .then((data) => parseSource(data))

export const fetchStatusHistory = ({ status, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_HISTORY_URL(status.id),
    credentials,
  }).then((data) => {
    data.reverse()
    return data.map((item) => {
      item.originalStatus = status
      return parseStatus(item)
    })
  })

export const fetchTimeline = ({
  timeline,
  credentials,
  since = false,
  minId = false,
  until = false,
  userId = false,
  listId = false,
  statusId = false,
  tag = false,
  withMuted = false,
  replyVisibility = 'all',
  includeTypes = [],
  bookmarkFolderId = false,
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
  const params = []

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

  if (minId) {
    params.push(['min_id', minId])
  }
  if (since) {
    params.push(['since_id', since])
  }
  if (until) {
    params.push(['max_id', until])
  }
  if (tag) {
    url = url(tag)
  }
  if (timeline === 'media') {
    params.push(['only_media', 1])
  }
  if (timeline === 'public') {
    params.push(['local', true])
  }
  if (timeline === 'public' || timeline === 'publicAndExternal') {
    params.push(['only_media', false])
  }
  if (timeline !== 'favorites' && timeline !== 'bookmarks') {
    params.push(['with_muted', withMuted])
  }
  if (replyVisibility !== 'all') {
    params.push(['reply_visibility', replyVisibility])
  }
  if (includeTypes.size > 0) {
    includeTypes.forEach((type) => {
      params.push(['include_types[]', type])
    })
  }
  if (timeline === 'bookmarks' && bookmarkFolderId) {
    params.push(['folder_id', bookmarkFolderId])
  }

  params.push(['limit', 20])

  const queryString = map(params, (param) => `${param[0]}=${param[1]}`).join(
    '&',
  )
  url += `?${queryString}`

  return promisedRequest({
    url,
    credentials,
  }).then(async (data) => {
    const pagination = parseLinkHeaderPagination(
      data._response.headers.get('Link'),
      {
        flakeId: timeline !== 'bookmarks' && timeline !== 'notifications',
      },
    )

    return {
      data: data.map(isNotifications ? parseNotification : parseStatus),
      pagination,
    }
  })
}

export const fetchPinnedStatuses = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_USER_TIMELINE_URL(id) + '?pinned=true',
    credentials,
  }).then((data) => data.map(parseStatus))

export const verifyCredentials = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_LOGIN_URL,
    credentials,
  }).then((data) => (data.error ? data : parseUser(data)))

export const favorite = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_FAVORITE_URL(id),
    method: 'POST',
    credentials,
  }).then((data) => parseStatus(data))

export const unfavorite = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNFAVORITE_URL(id),
    method: 'POST',
    credentials,
  }).then((data) => parseStatus(data))

export const retweet = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_RETWEET_URL(id),
    method: 'POST',
    credentials,
  }).then((data) => parseStatus(data))

export const unretweet = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNRETWEET_URL(id),
    method: 'POST',
    credentials,
  }).then((data) => parseStatus(data))

export const bookmarkStatus = ({ id, credentials, ...options }) =>
  promisedRequest({
    url: MASTODON_BOOKMARK_STATUS_URL(id),
    credentials,
    method: 'POST',
    payload: {
      folder_id: options.folder_id,
    },
  })

export const unbookmarkStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNBOOKMARK_STATUS_URL(id),
    credentials,
    method: 'POST',
  })

export const postStatus = ({
  credentials,
  status,
  spoilerText,
  visibility,
  sensitive,
  poll,
  mediaIds = [],
  inReplyToStatusId,
  quoteId,
  contentType,
  preview,
  idempotencyKey,
}) => {
  const form = new FormData()
  const pollOptions = poll.options || []

  form.append('status', status)
  form.append('source', 'Pleroma FE')
  if (spoilerText) form.append('spoiler_text', spoilerText)
  if (visibility) form.append('visibility', visibility)
  if (sensitive) form.append('sensitive', sensitive)
  if (contentType) form.append('content_type', contentType)
  mediaIds.forEach((val) => {
    form.append('media_ids[]', val)
  })
  if (pollOptions.some((option) => option !== '')) {
    const normalizedPoll = {
      expires_in: parseInt(poll.expiresIn, 10),
      multiple: poll.multiple,
    }
    Object.keys(normalizedPoll).forEach((key) => {
      form.append(`poll[${key}]`, normalizedPoll[key])
    })

    pollOptions.forEach((option) => {
      form.append('poll[options][]', option)
    })
  }
  if (inReplyToStatusId) {
    form.append('in_reply_to_id', inReplyToStatusId)
  }
  if (quoteId) {
    form.append('quote_id', quoteId)
  }
  if (preview) {
    form.append('preview', 'true')
  }

  const headers = {}
  if (idempotencyKey) {
    headers['idempotency-key'] = idempotencyKey
  }

  return promisedRequest({
    url: MASTODON_POST_STATUS_URL,
    formData: form,
    method: 'POST',
    credentials,
    headers,
  }).then((data) => (data.error ? data : parseStatus(data)))
}

export const editStatus = ({
  id,
  credentials,
  status,
  spoilerText,
  sensitive,
  poll,
  mediaIds = [],
  contentType,
}) => {
  const form = new FormData()
  const pollOptions = poll.options || []

  form.append('status', status)
  if (spoilerText) form.append('spoiler_text', spoilerText)
  if (sensitive) form.append('sensitive', sensitive)
  if (contentType) form.append('content_type', contentType)
  mediaIds.forEach((val) => {
    form.append('media_ids[]', val)
  })

  if (pollOptions.some((option) => option !== '')) {
    const normalizedPoll = {
      expires_in: parseInt(poll.expiresIn, 10),
      multiple: poll.multiple,
    }
    Object.keys(normalizedPoll).forEach((key) => {
      form.append(`poll[${key}]`, normalizedPoll[key])
    })

    pollOptions.forEach((option) => {
      form.append('poll[options][]', option)
    })
  }

  return promisedRequest({
    url: MASTODON_STATUS_URL(id),
    formData: form,
    method: 'PUT',
    credentials,
  }).then((data) => (data.error ? data : parseStatus(data)))
}

export const deleteStatus = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_DELETE_URL(id),
    credentials,
    method: 'DELETE',
  })

export const uploadMedia = ({ formData, credentials }) =>
  promisedRequest({
    url: MASTODON_MEDIA_UPLOAD_URL,
    formData,
    method: 'POST',
    credentials,
  }).then((data) => parseAttachment(data))

export const setMediaDescription = ({ id, description, credentials }) =>
  promisedRequest({
    url: `${MASTODON_MEDIA_UPLOAD_URL}/${id}`,
    method: 'PUT',
    credentials,
    payload: {
      description,
    },
  }).then((data) => parseAttachment(data))

export const importMutes = ({ file, credentials }) => {
  const formData = new FormData()
  formData.append('list', file)
  return promisedRequest({
    url: MUTES_IMPORT_URL,
    formData,
    method: 'POST',
    credentials,
  }).then((response) => response.ok)
}

export const importBlocks = ({ file, credentials }) => {
  const formData = new FormData()
  formData.append('list', file)
  return promisedRequest({
    url: BLOCKS_IMPORT_URL,
    formData,
    method: 'POST',
    credentials,
  }).then((response) => response.ok)
}

export const importFollows = ({ file, credentials }) => {
  const formData = new FormData()
  formData.append('list', file)
  return promisedRequest({
    url: FOLLOW_IMPORT_URL,
    formData,
    method: 'POST',
    credentials,
  }).then((response) => response.ok)
}

export const deleteAccount = ({ credentials, password }) => {
  const formData = new FormData()

  formData.append('password', password)

  return promisedRequest({
    url: DELETE_ACCOUNT_URL,
    formData,
    method: 'POST',
    credentials,
  })
}

export const changeEmail = ({ credentials, email, password }) => {
  const form = new FormData()

  form.append('email', email)
  form.append('password', password)

  return promisedRequest({
    url: CHANGE_EMAIL_URL,
    formData: form,
    method: 'POST',
    credentials,
  })
}

export const moveAccount = ({ credentials, password, targetAccount }) => {
  const form = new FormData()

  form.append('password', password)
  form.append('target_account', targetAccount)

  return promisedRequest({
    url: MOVE_ACCOUNT_URL,
    formData: form,
    method: 'POST',
    credentials,
  })
}

export const addAlias = ({ credentials, alias }) =>
  promisedRequest({
    url: ALIASES_URL,
    method: 'PUT',
    credentials,
    payload: { alias },
  })

export const deleteAlias = ({ credentials, alias }) =>
  promisedRequest({
    url: ALIASES_URL,
    method: 'DELETE',
    credentials,
    payload: { alias },
  })

export const listAliases = ({ credentials }) =>
  promisedRequest({
    url: ALIASES_URL,
    method: 'GET',
    credentials,
    params: {
      _cacheBooster: new Date().getTime(),
    },
  })

export const changePassword = ({
  credentials,
  password,
  newPassword,
  newPasswordConfirmation,
}) => {
  const form = new FormData()

  form.append('password', password)
  form.append('new_password', newPassword)
  form.append('new_password_confirmation', newPasswordConfirmation)

  return promisedRequest({
    url: CHANGE_PASSWORD_URL,
    formData: form,
    method: 'POST',
    credentials,
  })
}

export const settingsMFA = ({ credentials }) =>
  promisedRequest({
    url: MFA_SETTINGS_URL,
    credentials,
    method: 'GET',
  })

export const mfaDisableOTP = ({ credentials, password }) => {
  const form = new FormData()

  form.append('password', password)

  return promisedRequest({
    url: MFA_DISABLE_OTP_URL,
    formData: form,
    method: 'DELETE',
    credentials,
  })
}

export const mfaConfirmOTP = ({ credentials, password, token }) => {
  const form = new FormData()

  form.append('password', password)
  form.append('code', token)

  return promisedRequest({
    url: MFA_CONFIRM_OTP_URL,
    formData: form,
    credentials,
    method: 'POST',
  })
}
export const mfaSetupOTP = ({ credentials }) =>
  promisedRequest({
    url: MFA_SETUP_OTP_URL,
    credentials,
    method: 'GET',
  })
export const generateMfaBackupCodes = ({ credentials }) =>
  promisedRequest({
    url: MFA_BACKUP_CODES_URL,
    credentials,
    method: 'GET',
  })

export const fetchMutes = ({ maxId, credentials }) => {
  const query = new URLSearchParams({ with_relationships: true })
  if (maxId) {
    query.append('max_id', maxId)
  }
  return promisedRequest({
    url: `${MASTODON_USER_MUTES_URL}?${query.toString()}`,
    credentials,
  }).then((users) => users.map(parseUser))
}

export const muteUser = ({ id, expiresIn, credentials }) => {
  const payload = {}
  if (expiresIn) {
    payload.expires_in = expiresIn
  }

  return promisedRequest({
    url: MASTODON_MUTE_USER_URL(id),
    credentials,
    method: 'POST',
    payload,
  })
}

export const unmuteUser = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_UNMUTE_USER_URL(id),
    credentials,
    method: 'POST',
  })

export const fetchBlocks = ({ maxId, credentials }) => {
  const query = new URLSearchParams({ with_relationships: true })
  if (maxId) {
    query.append('max_id', maxId)
  }
  return promisedRequest({
    url: `${MASTODON_USER_BLOCKS_URL}?${query.toString()}`,
    credentials,
  }).then((users) => users.map(parseUser))
}

export const addBackup = ({ credentials }) =>
  promisedRequest({
    url: PLEROMA_BACKUP_URL,
    method: 'POST',
    credentials,
  })

export const listBackups = ({ credentials }) =>
  promisedRequest({
    url: PLEROMA_BACKUP_URL,
    method: 'GET',
    credentials,
    params: {
      _cacheBooster: new Date().getTime(),
    },
  })

export const fetchOAuthTokens = ({ credentials }) =>
  promisedRequest({
    url: '/api/oauth_tokens.json',
    credentials,
  })

export const revokeOAuthToken = ({ id, credentials }) =>
  promisedRequest({
    url: `/api/oauth_tokens/${id}`,
    credentials,
    method: 'DELETE',
  })

export const suggestions = ({ credentials }) =>
  promisedRequest({
    url: SUGGESTIONS_URL,
    credentials,
  })

export const markNotificationsAsSeen = ({
  id,
  credentials,
  single = false,
}) => {
  const formData = new FormData()

  if (single) {
    formData.append('id', id)
  } else {
    formData.append('max_id', id)
  }

  return promisedRequest({
    url: NOTIFICATION_READ_URL,
    formData,
    credentials,
    method: 'POST',
  })
}

export const vote = ({ pollId, choices, credentials }) => {
  const form = new FormData()
  form.append('choices', choices)

  return promisedRequest({
    url: MASTODON_VOTE_URL(encodeURIComponent(pollId)),
    method: 'POST',
    credentials,
    payload: {
      choices,
    },
  })
}

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
  }).then((users) => users.map(parseUser))

export const fetchRebloggedByUsers = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_STATUS_REBLOGGEDBY_URL(id),
    method: 'GET',
    credentials,
  }).then((users) => users.map(parseUser))

export const fetchEmojiReactions = ({ id, credentials }) =>
  promisedRequest({
    url: PLEROMA_EMOJI_REACTIONS_URL(id),
    credentials,
  }).then((reactions) =>
    reactions.map((r) => {
      r.accounts = r.accounts.map(parseUser)
      return r
    }),
  )

export const reactWithEmoji = ({ id, emoji, credentials }) =>
  promisedRequest({
    url: PLEROMA_EMOJI_REACT_URL(id, emoji),
    method: 'PUT',
    credentials,
  }).then(parseStatus)

export const unreactWithEmoji = ({ id, emoji, credentials }) =>
  promisedRequest({
    url: PLEROMA_EMOJI_UNREACT_URL(id, emoji),
    method: 'DELETE',
    credentials,
  }).then(parseStatus)

export const reportUser = ({
  credentials,
  userId,
  statusIds,
  comment,
  forward,
}) =>
  promisedRequest({
    url: MASTODON_REPORT_USER_URL,
    method: 'POST',
    payload: {
      account_id: userId,
      status_ids: statusIds,
      comment,
      forward,
    },
    credentials,
  })

export const searchUsers = ({ credentials, query }) =>
  promisedRequest({
    url: MASTODON_USER_SEARCH_URL,
    params: {
      q: query,
      resolve: true,
    },
    credentials,
  }).then((data) => data.map(parseUser))

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
    .then((data) => {
      if (data.ok) {
        return data
      }
      throw new Error('Error fetching search result', data)
    })
    .then((data) => {
      data.accounts = data.accounts.slice(0, limit).map((u) => parseUser(u))
      data.statuses = data.statuses.slice(0, limit).map((s) => parseStatus(s))
      return data
    })
}

export const fetchKnownDomains = ({ credentials }) =>
  promisedRequest({ url: MASTODON_KNOWN_DOMAIN_LIST_URL, credentials })

export const fetchDomainMutes = ({ credentials }) =>
  promisedRequest({ url: MASTODON_DOMAIN_BLOCKS_URL, credentials })

export const muteDomain = ({ domain, credentials }) =>
  promisedRequest({
    url: MASTODON_DOMAIN_BLOCKS_URL,
    method: 'POST',
    payload: { domain },
    credentials,
  })

export const unmuteDomain = ({ domain, credentials }) =>
  promisedRequest({
    url: MASTODON_DOMAIN_BLOCKS_URL,
    method: 'DELETE',
    payload: { domain },
    credentials,
  })

export const dismissNotification = ({ credentials, id }) =>
  promisedRequest({
    url: MASTODON_DISMISS_NOTIFICATION_URL(id),
    method: 'POST',
    payload: { id },
    credentials,
  })

export const getAnnouncements = ({ credentials }) =>
  promisedRequest({ url: MASTODON_ANNOUNCEMENTS_URL, credentials })

export const dismissAnnouncement = ({ id, credentials }) =>
  promisedRequest({
    url: MASTODON_ANNOUNCEMENTS_DISMISS_URL(id),
    credentials,
    method: 'POST',
  })

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

export const chats = ({ credentials }) =>
  promisedRequest({
    url: PLEROMA_CHATS_URL,
    credentials,
  }).then((data) => {
    chats: data.map(parseChat).filter((c) => c)
  })

export const getOrCreateChat = ({ accountId, credentials }) =>
  promisedRequest({
    url: PLEROMA_CHAT_URL(accountId),
    method: 'POST',
    credentials,
  })

export const chatMessages = ({
  id,
  credentials,
  maxId,
  sinceId,
  limit = 20,
}) => {
  let url = PLEROMA_CHAT_MESSAGES_URL(id)
  const args = [
    maxId && `max_id=${maxId}`,
    sinceId && `since_id=${sinceId}`,
    limit && `limit=${limit}`,
  ]
    .filter((_) => _)
    .join('&')

  url = url + (args ? '?' + args : '')

  return promisedRequest({
    url,
    method: 'GET',
    credentials,
  })
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
  })
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

export const fetchScrobbles = ({ accountId, limit = 1 }) => {
  let url = PLEROMA_SCROBBLES_URL(accountId)
  const params = [['limit', limit]]
  const queryString = map(params, (param) => `${param[0]}=${param[1]}`).join(
    '&',
  )
  url += `?${queryString}`
  return promisedRequest({ url })
}

export const fetchBookmarkFolders = ({ credentials }) =>
  promisedRequest({
    url: PLEROMA_BOOKMARK_FOLDERS_URL,
    credentials,
  })

export const createBookmarkFolder = ({ name, emoji, credentials }) =>
  promisedRequest({
    url: PLEROMA_BOOKMARK_FOLDERS_URL,
    credentials,
    method: 'POST',
    payload: { name, emoji },
  })

export const updateBookmarkFolder = ({ folderId, name, emoji, credentials }) =>
  promisedRequest({
    url: PLEROMA_BOOKMARK_FOLDER_URL(folderId),
    credentials,
    method: 'PATCH',
    payload: { name, emoji },
  })

export const deleteBookmarkFolder = ({ folderId, credentials }) =>
  promisedRequest({
    url: PLEROMA_BOOKMARK_FOLDER_URL(folderId),
    method: 'DELETE',
    credentials,
  })
