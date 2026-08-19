import { ref } from 'vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'

import { fetchTimeline } from 'src/api/timelines.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

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

const notificationsFetcher = (credentials) => {
  const interval = ref(null)
  const loading = ref(false)
  const bottomedOut = ref(false)

  const fetchNotifications = async ({ args, older }) => {
    loading.value = true

    try {
      const response = await fetchTimeline(args)
      const notifications = response.data
      if (older && notifications.length === 0) bottomedOut.value = true

      useNotificationsStore().addNewNotifications(response)
    } catch (error) {
      if (
        error.statusCode === 400 &&
        error.statusText.includes('Invalid value for enum')
      ) {
        error.statusText
          .matchAll(/(\w+) - Invalid value for enum./g)
          .toArray()
          .map((x) => x[1])
          .forEach((x) => mastoApiNotificationTypes.delete(x))

        // Retry
        return await fetchNotifications({ args, older })
      }

      console.error('Notifications Error', error)
      useInterfaceStore().pushGlobalNotice({
        level: 'error',
        messageKey: 'notifications.error',
        messageArgs: [error.message],
        timeout: 5000,
      })
    } finally {
      loading.value = false
    }
  }

  const fetchAndUpdate = async ({ older = false, sinceId } = {}) => {
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
      return await fetchNotifications({ args, older })
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
      const result = await fetchNotifications({ args, older })

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

  const startFetching = () => {
    if (interval.value) throw new Error('Interval already exists!')

    fetchAndUpdate()

    interval.value = promiseInterval(fetchAndUpdate, 10000)
  }

  const stopFetching = () => {
    interval.value.stop()
    interval.value = null
  }

  return {
    loading,
    bottomedOut,
    startFetching,
    stopFetching,
    fetchOlder: () => fetchAndUpdate({ older: true }),
  }
}

export default notificationsFetcher
