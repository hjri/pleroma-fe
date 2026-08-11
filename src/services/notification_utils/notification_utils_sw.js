import FaviconService from 'src/services/favicon_service/favicon_service.js'

const statusNotifications = new Set([
  'like',
  'mention',
  'status',
  'repeat',
  'pleroma:emoji_reaction',
  'poll',
])

let cachedBadgeUrl = null

export const isStatusNotification = (type) => statusNotifications.has(type)

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
