import { fetchTimeline } from '../api/api.service.js'
import { promiseInterval } from '../promise_interval/promise_interval.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

const update = ({ store, notifications, older }) => {
  store.dispatch('addNewNotifications', { notifications, older })
}
//
// For using include_types when fetching notifications.
// Note: chat_mention excluded as pleroma-fe polls them separately
const mastoApiNotificationTypes = new Set([
  'mention',
  'status',
  'favourite',
  'reblog',
  'follow',
  'follow_request',
  'move',
  'poll',
  'pleroma:emoji_reaction',
  'pleroma:report',
])

const fetchAndUpdate = ({ store, credentials, older = false, sinceId }) => {
  const args = { credentials }
  const rootState = store.rootState || store.state
  const timelineData = rootState.notifications
  const hideMutedPosts = useMergedConfigStore().mergedConfig.hideMutedPosts

  if (useInstanceCapabilitiesStore().pleromaChatMessagesAvailable) {
    mastoApiNotificationTypes.add('pleroma:chat_mention')
  }

  args.includeTypes = [...mastoApiNotificationTypes]
  args.withMuted = !hideMutedPosts

  args.timeline = 'notifications'
  if (older) {
    if (timelineData.minId !== Number.POSITIVE_INFINITY) {
      args.maxId = timelineData.minId
    }
    return fetchNotifications({ store, args, older })
  } else {
    // fetch new notifications
    if (
      sinceId === undefined &&
      timelineData.maxId !== Number.POSITIVE_INFINITY
    ) {
      args.sinceId = timelineData.maxId
    } else if (sinceId !== null) {
      args.sinceId = sinceId
    }
    const result = fetchNotifications({ store, args, older })

    // If there's any unread notifications, try fetch notifications since
    // the newest read notification to check if any of the unread notifs
    // have changed their 'seen' state (marked as read in another session), so
    // we can update the state in this session to mark them as read as well.
    // The normal maxId-check does not tell if older notifications have changed
    const notifications = timelineData.data
    const readNotifsIds = notifications.filter((n) => n.seen).map((n) => n.id)
    const unreadNotifsIds = notifications
      .filter((n) => !n.seen)
      .map((n) => n.id)
    if (readNotifsIds.length > 0 && readNotifsIds.length > 0) {
      const minId = Math.min(...unreadNotifsIds) // Oldest known unread notification
      if (minId !== Infinity) {
        args.sinceId = null // Don't use since_id since it sorta conflicts with min_id
        args.minId = minId - 1 // go beyond
        fetchNotifications({ store, args, older })
      }
    }

    return result
  }
}

const fetchNotifications = ({ store, args, older }) => {
  return fetchTimeline(args)
    .then((response) => {
      if (response.errors) {
        if (
          response.status === 400 &&
          response.statusText.includes('Invalid value for enum')
        ) {
          response.statusText
            .matchAll(/(\w+) - Invalid value for enum./g)
            .toArray()
            .map((x) => x[1])
            .forEach((x) => mastoApiNotificationTypes.delete(x))
          return fetchNotifications({ store, args, older })
        } else {
          throw new Error(`${response.status} ${response.statusText}`)
        }
      }
      const notifications = response.data
      update({ store, notifications, older })
      return notifications
    })
    .catch((error) => {
      useInterfaceStore().pushGlobalNotice({
        level: 'error',
        messageKey: 'notifications.error',
        messageArgs: [error.message],
        timeout: 5000,
      })
      console.error(error)
    })
}

const startFetching = ({ credentials, store }) => {
  // Initially there's set flag to silence all desktop notifications so
  // that there won't spam of them when user just opened up the FE we
  // reset that flag after a while to show new notifications once again.
  setTimeout(() => store.dispatch('setNotificationsSilence', false), 10000)
  const boundFetchAndUpdate = () => fetchAndUpdate({ credentials, store })
  boundFetchAndUpdate()
  return promiseInterval(boundFetchAndUpdate, 10000)
}

const notificationsFetcher = {
  fetchAndUpdate,
  startFetching,
}

export default notificationsFetcher
