import { showDesktopNotification } from '../desktop_notification_utils/desktop_notification_utils.js'
import { muteFilterHits } from '../status_parser/status_parser.js'

import { useNotificationsStore } from 'src/stores/notifications.js'

import FaviconService from 'src/services/favicon_service/favicon_service.js'

export const ACTIONABLE_NOTIFICATION_TYPES = new Set([
  'mention',
  'pleroma:report',
  'follow_request',
])

let cachedBadgeUrl = null

const visibleTypes = (notificationVisibility) => {
  return [
    notificationVisibility.likes && 'like',
    notificationVisibility.mentions && 'mention',
    notificationVisibility.statuses && 'status',
    notificationVisibility.repeats && 'repeat',
    notificationVisibility.follows && 'follow',
    notificationVisibility.followRequest && 'follow_request',
    notificationVisibility.moves && 'move',
    notificationVisibility.emojiReactions && 'pleroma:emoji_reaction',
    notificationVisibility.reports && 'pleroma:report',
    notificationVisibility.polls && 'poll',
  ].filter(Boolean)
}

const statusNotifications = new Set([
  'like',
  'mention',
  'status',
  'repeat',
  'pleroma:emoji_reaction',
  'poll',
])

export const isStatusNotification = (type) => statusNotifications.has(type)

export const isValidNotification = (notification) => {
  if (isStatusNotification(notification.type) && !notification.status) {
    return false
  }
  return true
}

const sortById = (a, b) => {
  const seqA = Number(a.id)
  const seqB = Number(b.id)
  const isSeqA = !Number.isNaN(seqA)
  const isSeqB = !Number.isNaN(seqB)
  if (isSeqA && isSeqB) {
    return seqA > seqB ? -1 : 1
  } else if (isSeqA && !isSeqB) {
    return 1
  } else if (!isSeqA && isSeqB) {
    return -1
  } else {
    return a.id > b.id ? -1 : 1
  }
}

const isMutedNotification = (muteFilters, notification) => {
  if (!notification.status) return false
  if (notification.status.muted) return true
  return muteFilterHits(muteFilters, notification.status).length > 0
}

export const maybeShowNotification = (
  notificationVisibility,
  muteFilters,
  notification,
  i18n,
) => {
  if (notification.seen) return
  if (!visibleTypes(notificationVisibility).includes(notification.type)) return
  if (
    notification.type === 'mention' &&
    isMutedNotification(muteFilters, notification)
  )
    return

  const notificationObject = prepareNotificationObject(notification, i18n)
  showDesktopNotification(notificationObject)
}

export const filteredNotifications = (notificationVisibility, types) => {
  // map is just to clone the array since sort mutates it and it causes some issues
  const sortedNotifications = useNotificationsStore().data.sort(sortById)
  // TODO implement sorting elsewhere and make it optional
  return sortedNotifications.filter((notification) =>
    (types || visibleTypes(notificationVisibility)).includes(notification.type),
  )
}

export const unseenNotifications = (
  notificationVisibility,
  ignoreInactionableSeen,
) => {
  return filteredNotifications(notificationVisibility).filter(
    ({ seen, type }) => {
      if (!ignoreInactionableSeen) return !seen
      if (seen) return false
      return ACTIONABLE_NOTIFICATION_TYPES.has(type)
    },
  )
}

export const prepareNotificationObject = (notification, i18n) => {
  if (cachedBadgeUrl === null) {
    const favicons = FaviconService.getOriginalFavicons()
    const favicon = favicons[favicons.length - 1]
    if (!favicon) {
      cachedBadgeUrl = 'about:blank'
    } else {
      cachedBadgeUrl = favicon.favimg.src
    }
  }

  const notifObj = {
    tag: notification.id,
    type: notification.type,
    badge: cachedBadgeUrl,
  }
  const status = notification.status
  const title = notification.from_profile.name
  notifObj.title = title
  notifObj.icon = notification.from_profile.profile_image_url
  let i18nString
  switch (notification.type) {
    case 'like':
      i18nString = 'favorited_you'
      break
    case 'status':
      i18nString = 'subscribed_status'
      break
    case 'repeat':
      i18nString = 'repeated_you'
      break
    case 'follow':
      i18nString = 'followed_you'
      break
    case 'move':
      i18nString = 'migrated_to'
      break
    case 'follow_request':
      i18nString = 'follow_request'
      break
    case 'pleroma:report':
      i18nString = 'submitted_report'
      break
    case 'poll':
      i18nString = 'poll_ended'
      break
  }

  if (notification.type === 'pleroma:emoji_reaction') {
    notifObj.body = i18n.t('notifications.reacted_with', [notification.emoji])
  } else if (i18nString) {
    notifObj.body = i18n.t('notifications.' + i18nString)
  } else if (isStatusNotification(notification.type)) {
    notifObj.body = notification.status.text
  }

  // Shows first attached non-nsfw image, if any. Should add configuration for this somehow...
  if (!status.nsfw && status?.attachments?.[0]?.mimetype.startsWith('image/')) {
    notifObj.image = status.attachments[0].url
  }

  return notifObj
}

export const countExtraNotifications = (
  store,
  mergedConfig,
  unreadChatsCount,
  unreadAnnouncementCount,
) => {
  const rootGetters = store.rootGetters || store.getters

  if (!mergedConfig.showExtraNotifications) {
    return 0
  }

  return [
    mergedConfig.showChatsInExtraNotifications ? unreadChatsCount : 0,
    mergedConfig.showAnnouncementsInExtraNotifications
      ? unreadAnnouncementCount
      : 0,
    mergedConfig.showFollowRequestsInExtraNotifications
      ? rootGetters.followRequestCount
      : 0,
  ].reduce((a, c) => a + c, 0)
}
