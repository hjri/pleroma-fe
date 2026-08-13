import { defineStore } from 'pinia'

import { useI18nStore } from 'src/stores/i18n.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useReportsStore } from 'src/stores/reports.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { dismissNotification, markNotificationsAsSeen } from 'src/api/user.js'
import {
  closeAllDesktopNotifications,
  closeDesktopNotification,
} from 'src/services/desktop_notification_utils/desktop_notification_utils.js'
import {
  isValidNotification,
  maybeShowNotification,
} from 'src/services/notification_utils/notification_utils.js'
import { isStatusNotification } from 'src/services/notification_utils/notification_utils_sw.js'
import notificationsFetcher from 'src/services/notifications_fetcher/notifications_fetcher.service.js'

export const defaultState = () => ({
  desktopNotificationSilence: true,
  maxId: '',
  minId: '',
  data: [],
  statusNotificationRelations: new WeakMap(),
  idStore: new Map(),
  loading: false,
  socket: null,
  streaming: false,
  fetcher: null,
})

export const useNotificationsStore = defineStore('notifications', {
  state: defaultState,
  actions: {
    // Init
    attachSocket() {
      const et = new EventTarget()
      const handleNotificationMessage = ({ data, timestamp }) => {
        this.addNewNotifications({ data: [data.notification], timestamp })
      }
      const notificationHandler = ({ detail: message }) => {
        handleNotificationMessage(message)
      }
      const openHandler = () => this.onStreamConnect()
      const closeHandler = () => this.onStreamDisconnect()
      const socket = {
        et,
        handlers: {
          openHandler,
          closeHandler,
          notificationHandler,
        },
      }

      et.addEventListener('notification', notificationHandler)
      et.addEventListener('open', openHandler)
      et.addEventListener('close', closeHandler)

      useStreamingStore().addSubscriber(socket)
      this.socket = socket
    },
    activate() {
      this.attachSocket()

      // Initially there's set flag to silence all desktop notifications so
      // that there won't spam of them when user just opened up the FE we
      // reset that flag after a while to show new notifications once again.
      setTimeout(() => (this.desktopNotificationSilence = false), 10000)

      if (this.fetcher) throw new Error('Fetcher already exists!')
      this.fetcher = notificationsFetcher(useOAuthStore().token)
      this.startFetching('Notifications activated')
    },
    deactivate() {
      if (!this.streaming) {
        this.stopFetching('Notifications deactivated')
      }

      useStreamingStore().removeSubscriber(this.socket)
      const { openHandler, closeHandler, notificationHandler } =
        this.socket.handlers

      this.socket.et.removeEventListener('notification', openHandler)
      this.socket.et.removeEventListener('notification', closeHandler)
      this.socket.et.removeEventListener('notification', notificationHandler)

      const blankState = defaultState()
      Object.keys(blankState).forEach((k) => {
        this[k] = blankState[k]
      })
    },

    // Poll & Push
    onStreamConnect() {
      console.debug('[Notifications] Notifications stream connected')
      this.streaming = true
      this.stopFetching('Socket connected')
    },
    onStreamDisconnect() {
      console.debug('[Notifications] Notifications stream disconnected')
      this.streaming = false
      this.startFetching('Socket disconnected')
    },
    startFetching(reason) {
      console.debug(
        '[Notifications] Starting fetching notifications',
        'Reason:',
        reason,
      )
      this.fetcher.startFetching()
    },
    stopFetching(reason) {
      console.debug(
        '[Notifications] Stopped fetching notifications',
        'Reason:',
        reason,
      )
      this.fetcher.stopFetching()
    },

    // Updates
    updateNotificationsMinMaxId(id) {
      this.maxId = id > this.maxId ? id : this.maxId
      this.minId = id < this.minId ? id : this.minId
    },
    updateNotification({ id, updater }) {
      const notification = this.idStore.get(id)
      notification && updater(notification)
    },
    addNewNotifications(result) {
      const { timestamp, data: notifications } = result

      useUsersStore().addNewUsers({
        timestamp,
        data: notifications.map((n) => n.from_profile),
      })
      notifications.forEach(
        (n) => (n.from_profile = useUsersStore().findUser(n.from_profile.id)),
      )

      const validNotifications = notifications.filter((notification) => {
        // If invalid notification, update ids but don't add it to store
        if (!isValidNotification(notification)) {
          console.error('Invalid notification:', notification)
          this.updateNotificationsMinMaxId(notification.id)
          return false
        }
        return true
      })

      useUsersStore().addNewUsers({
        timestamp,
        data: validNotifications.map(
          (notification) => notification.from_profile,
        ),
      })

      const statusNotifications = validNotifications.filter(
        (notification) =>
          isStatusNotification(notification.type) && notification.status,
      )

      // Synchronous commit to add all the statuses
      useStatusesStore().addNewStatuses({
        timestamp,
        statuses: statusNotifications.map(
          (notification) => notification.status,
        ),
      })

      // Update references to statuses in notifications to ones in the store
      statusNotifications.forEach((notification) => {
        const id = notification.status.id
        const referenceStatus = useStatusesStore().allStatuses.get(id)

        if (referenceStatus) {
          notification.status = referenceStatus
        }
      })

      validNotifications.forEach((notification) => {
        if (notification.type === 'pleroma:report') {
          useReportsStore().addReport(notification.report)
        }

        if (notification.type === 'pleroma:emoji_reaction') {
          useStatusesStore().fetchEmojiReactionsBy(notification.status.id)
        }

        // Only add a new notification if we don't have one for the same action
        if (!this.idStore.has(notification.id)) {
          this.updateNotificationsMinMaxId(notification.id)

          notifications.forEach((notification) => {
            this.data.push(notification)
            this.idStore.set(notification.id, notification)
          })

          this.statusNotificationRelations.set(
            notification.status,
            this.idStore.get(notification.id),
          )

          maybeShowNotification(
            useMergedConfigStore().mergedConfig.notificationVisibility,
            Object.values(useSyncConfigStore().prefsStorage.simple.muteFilters),
            notification,
            useI18nStore().i18n,
          )
        } else if (notification.seen) {
          this.idStore.get(notification.id).seen = true
        }
      })
    },

    // Seen / Dismiss
    notificationClicked(id) {
      const notification = this.idStore.get(id)
      const { type, seen } = notification

      if (!seen) {
        switch (type) {
          case 'mention':
          case 'pleroma:report':
          case 'follow_request':
            break
          default:
            this.markSingleNotificationAsSeen({ id })
        }
      }
    },
    markNotificationsAsSeen() {
      this.data.forEach((notification) => {
        notification.seen = true
      })

      markNotificationsAsSeen({
        id: this.maxId,
        credentials: useUsersStore().currentUser.credentials,
      }).then(() => {
        closeAllDesktopNotifications()
      })
    },
    markSingleNotificationAsSeen({ id }) {
      const notification = this.idStore.get(id)
      if (notification) notification.seen = true

      markNotificationsAsSeen({
        single: true,
        id,
        credentials: useUsersStore().currentUser.credentials,
      }).then(() => {
        closeDesktopNotification(id)
      })
    },
    dismissNotificationLocal(id) {
      this.data = this.data.filter((n) => n.id !== id)
      delete this.idStore.delete(id)
    },
    dismissNotification(id) {
      this.dismissNotificationLocal(id)

      dismissNotification({
        id,
        credentials: useOAuthStore().token,
      })
    },

    // Misc
    setLoading(value) {
      this.loading = value
    },
  },
})
