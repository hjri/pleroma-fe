import { muteFilterHits } from '../status_parser/status_parser.js'
import { showDesktopNotification } from '../desktop_notification_utils/desktop_notification_utils.js'
import { useI18nStore } from 'src/stores/i18n.js'
import { useAnnouncementsStore } from 'src/stores/announcements'

import FaviconService from 'src/services/favicon_service/favicon_service.js'

export const ACTIONABLE_NOTIFICATION_TYPES = new Set(['mention', 'pleroma:report', 'follow_request'])

let cachedBadgeUrl = null

export const notificationsFromStore = store => store.state.notifications.data

export const visibleTypes = store => {
  // When called from within a module we need rootGetters to access wider scope
  // however when called from a component (i.e. this.$store) we already have wider scope
  const rootGetters = store.rootGetters || store.getters
  const { notificationVisibility } = rootGetters.mergedConfig

  return ([
    notificationVisibility.likes && 'like',
    notificationVisibility.mentions && 'mention',
    notificationVisibility.statuses && 'status',
    notificationVisibility.repeats && 'repeat',
    notificationVisibility.follows && 'follow',
    notificationVisibility.followRequest && 'follow_request',
    notificationVisibility.moves && 'move',
    notificationVisibility.emojiReactions && 'pleroma:emoji_reaction',
    notificationVisibility.reports && 'pleroma:report',
    notificationVisibility.polls && 'poll'
  ].filter(_ => _))
}

const statusNotifications = new Set(['like', 'mention', 'status', 'repeat', 'pleroma:emoji_reaction', 'poll'])

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

const isMutedNotification = (notification) => {
  if (!notification.status) return false
  if (notification.status.muted) return true
  return muteFilterHits(notification.status).length > 0
}

export const maybeShowNotification = (store, notification) => {
  const rootState = store.rootState || store.state

  if (notification.seen) return
  if (!visibleTypes(store).includes(notification.type)) return
  if (notification.type === 'mention' && isMutedNotification(notification)) return

  const notificationObject = prepareNotificationObject(notification, useI18nStore().i18n)
  showDesktopNotification(rootState, notificationObject)
}

export const filteredNotificationsFromStore = (store, types) => {
  // map is just to clone the array since sort mutates it and it causes some issues
  const sortedNotifications = notificationsFromStore(store).map(_ => _).sort(sortById)
  // TODO implement sorting elsewhere and make it optional
  return sortedNotifications.filter(
    (notification) => (types || visibleTypes(store)).includes(notification.type)
  )
}

export const unseenNotificationsFromStore = store => {
  const rootGetters = store.rootGetters || store.getters
  const ignoreInactionableSeen = rootGetters.mergedConfig.ignoreInactionableSeen

  return filteredNotificationsFromStore(store).filter(({ seen, type }) => {
    if (!ignoreInactionableSeen) return !seen
    if (seen) return false
    return ACTIONABLE_NOTIFICATION_TYPES.has(type)
  })
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
    badge: cachedBadgeUrl
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
  if (status && status.attachments && status.attachments.length > 0 && !status.nsfw &&
    status.attachments[0].mimetype.startsWith('image/')) {
    notifObj.image = status.attachments[0].url
  }

  return notifObj
}

export const countExtraNotifications = (store) => {
  const rootGetters = store.rootGetters || store.getters
  const mergedConfig = rootGetters.mergedConfig

  if (!mergedConfig.showExtraNotifications) {
    return 0
  }

  return [
    mergedConfig.showChatsInExtraNotifications ? rootGetters.unreadChatCount : 0,
    mergedConfig.showAnnouncementsInExtraNotifications ? useAnnouncementsStore().unreadAnnouncementCount : 0,
    mergedConfig.showFollowRequestsInExtraNotifications ? rootGetters.followRequestCount : 0
  ].reduce((a, c) => a + c, 0)
}
