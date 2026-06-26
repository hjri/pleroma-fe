import { paramsString, promisedRequest } from './helpers.js'

import {
  parseLinkHeaderPagination,
  parseNotification,
  parseStatus,
} from 'src/services/entity_normalizer/entity_normalizer.service.js'

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
export const MASTODON_USER_TIMELINE_URL = (
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

const MASTODON_USER_NOTIFICATIONS_URL = ({
  minId,
  sinceId,
  maxId,
  limit,
  includeTypes,
  replyVisibility,
}) =>
  `/api/v1/notifications${paramsString({ minId, sinceId, maxId, limit, includeTypes, replyVisibility })}`

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
