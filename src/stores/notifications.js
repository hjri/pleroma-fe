import { defineStore } from 'pinia'

import notificationsFetcher from 'src/stores/fetchers/notifications_fetcher.js'
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

export const defaultState = () => ({
  desktopNotificationSilence: true,
  maxId: '',
  minId: '',
  data: [],
  statusNotificationRelations: new WeakMap(),
  idStore: new Map(),
  statusIdStore: new Set(),
  socket: null,
  streaming: false,
  fetching: true,
  fetcher: null,
  paused: false,
})

export const useNotificationsStore = defineStore('notifications', {
  state: defaultState,
  actions: {
    // Init
    attachSocket() {
      const et = new EventTarget()
      const socket = {
        name: 'notifications',
        et,
      }

      et.addEventListener('notification', this.addNewNotifications)
      et.addEventListener('open', this.onStreamConnect)
      et.addEventListener('close', this.onStreamDisconnect)

      this.socket = socket
      useStreamingStore().addSubscriber(this.socket)
    },
    pause() {
      this.paused = true
      if (this.fetcher && this.fetching) {
        this.stopFetching('Notifications paused')
      }
    },
    resume() {
      this.paused = false
      if (this.fetcher && this.fetching) {
        this.startFetching('Notifications resumed')
      }
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
      if (this.fetching) {
        this.stopFetching('Notifications deactivated')
      }

      useStreamingStore().removeSubscriber(this.socket)

      const { et } = this.socket
      et.removeEventListener('notification', this.addNewNotifications)
      et.removeEventListener('open', this.onStreamConnect)
      et.removeEventListener('close', this.onStreamDisconnect)

      const blankState = defaultState()
      Object.keys(blankState).forEach((k) => {
        this[k] = blankState[k]
      })
      console.debug('[Notifications] Deactivated', this.fetcher)
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
      if (this.paused) {
        console.debug(
          '[Notificatiosn] NOT Starting notifications fetcher because it is paused',
          'Original Reason:',
          reason,
        )
        return
      }
      console.debug(
        '[Notifications] Starting notifications fetcher',
        'Reason:',
        reason,
      )
      this.fetcher.startFetching()
      this.fetching = true
    },
    stopFetching(reason) {
      this.fetcher.stopFetching()
      this.fetching = false
      console.debug(
        '[Notifications] Stopped notifications fetcher',
        'Reason:',
        reason,
      )
    },

    // Updates
    updateExtremes(id) {
      if (this.maxId === '' || id > this.maxId) {
        this.maxId = id
      }
      if (this.minId === '' || id < this.minId) {
        this.minId = id
      }
    },
    addNewNotifications(result, older) {
      const { timestamp, data } = result

      const notifications = older ? data : [...data].reverse()

      useUsersStore().addNewUsers({
        timestamp,
        data: notifications.map((n) => n.from_profile),
      })

      notifications.forEach((n) => {
        n.from_profile = useUsersStore().findUser(n.from_profile.id)
      })

      const validNotifications = notifications.filter((notification) => {
        // If invalid notification, update ids but don't add it to store
        if (!isValidNotification(notification)) {
          console.error('Invalid notification:', notification)
          this.updateExtremes(notification.id)
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
          useStatusesStore().fetchEmojiReactions(notification.status.id)
        }

        // Only add a new notification if we don't have one for the same action
        if (!this.idStore.has(notification.id)) {
          this.updateExtremes(notification.id)

          if (older) {
            this.data.push(notification)
          } else {
            this.data.unshift(notification)
          }
          this.idStore.set(notification.id, notification)

          if (notification.status) {
            this.statusNotificationRelations.set(
              notification.status,
              this.idStore.get(notification.id),
            )
          }

          maybeShowNotification(
            useMergedConfigStore().mergedConfig.notificationVisibility,
            Object.values(
              useSyncConfigStore().prefsStorage.simple.muteFilters ?? {},
            ),
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
            this.markSingleNotificationAsSeen(id)
        }
      }
    },
    markNotificationsAsSeen() {
      this.data.forEach((notification) => {
        notification.seen = true
      })

      markNotificationsAsSeen({
        id: this.maxId,
        credentials: useOAuthStore().token,
      }).then(() => {
        closeAllDesktopNotifications()
      })
    },
    markSingleNotificationAsSeen(id) {
      const notification = this.idStore.get(id)
      if (notification) notification.seen = true

      markNotificationsAsSeen({
        single: true,
        id,
        credentials: useOAuthStore().token,
      }).then(() => {
        closeDesktopNotification(id)
      })
    },
    dismissNotificationLocal(id) {
      this.idStore.delete(id)
      this.syncOrder()
    },
    dismissNotification(id) {
      this.dismissNotificationLocal(id)

      dismissNotification({
        id,
        credentials: useOAuthStore().token,
      })
    },
    syncOrder() {
      this.minId = ''
      this.maxId = ''
      this.data = this.data.filter(({ id }) => {
        const present = this.idStore.has(id)
        if (present) {
          this.updateExtremes(id) // Side-effect
        }
        return present
      })
    },
    wipeStatuses(ids) {
      const set = new Set(ids)
      this.data.forEach((notification) => {
        const status =
          isStatusNotification(notification.type) && notification.status
        if (status && set.has(status.id)) {
          this.idStore.delete(notification.id)
        }
      })

      this.syncOrder()
    },
  },
})
