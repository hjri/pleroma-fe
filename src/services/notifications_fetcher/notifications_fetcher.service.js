import { promiseInterval } from '../promise_interval/promise_interval.js'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'

import { fetchTimeline } from 'src/api/timelines.js'

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

const fetchAndUpdate = (
  { credentials },
  { older = false, sinceId }
) => {
  useNotificationsStore().setLoading(true)
  const args = { credentials }
  const timelineData = useNotificationsStore()
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
    return fetchNotifications({ args, older })
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
    const result = fetchNotifications({ args, older })

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

    if (readNotifsIds.length > 0 && unreadNotifsIds.length > 0) {
      const minId = Math.min(...unreadNotifsIds) // Oldest known unread notification
      if (minId !== Infinity) {
        args.sinceId = null // Don't use since_id since it sorta conflicts with min_id
        args.minId = minId - 1 // go beyond
        fetchNotifications({ args, older })
      }
    }

    return result
  }
}

const fetchNotifications = ({ args, older }) => {
  return fetchTimeline(args)
    .then((response) => {
      const notifications = response.data

      useNotificationsStore().addNewNotifications(response)

      return notifications
    })
    .catch((error) => {
      if (
        error.statusCode === 400 &&
        error.statusText.includes('Invalid value for enum')
      ) {
        error.statusText
          .matchAll(/(\w+) - Invalid value for enum./g)
          .toArray()
          .map((x) => x[1])
          .forEach((x) => mastoApiNotificationTypes.delete(x))
        return fetchNotifications({ args, older })
      }

      useInterfaceStore().pushGlobalNotice({
        level: 'error',
        messageKey: 'notifications.error',
        messageArgs: [error.message],
        timeout: 5000,
      })
      console.error(error)
    })
    .finally(() => {
      useNotificationsStore().setLoading(false)
    })
}


const notificationsFetcher = (credentials) => {
  const state = {
    interval: null,
  }

  const boundFetchAndUpdate = ({ older = false, sinceId } = {}) =>
    fetchAndUpdate({ credentials }, { older, sinceId })

  const startFetching = () => {
    if (state.interval) throw new Error('Interval already exists!')

    boundFetchAndUpdate()

    state.interval = promiseInterval(boundFetchAndUpdate, 10000)
  }

  const stopFetching = () => {
    state.interval.stop()
    state.interval = null
  }

  return {
    startFetching,
    stopFetching,
    fetchAndUpdate: boundFetchAndUpdate,
  }
}

export default notificationsFetcher
