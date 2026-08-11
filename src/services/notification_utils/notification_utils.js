import { showDesktopNotification } from '../desktop_notification_utils/desktop_notification_utils.js'
import { muteFilterHits } from '../status_parser/status_parser.js'
import { prepareNotificationObject, isStatusNotification } from './notification_utils_sw.js'

import { useNotificationsStore } from 'src/stores/notifications.js'

export const ACTIONABLE_NOTIFICATION_TYPES = new Set([
  'mention',
  'pleroma:report',
  'follow_request',
])

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
