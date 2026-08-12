import { defineStore } from 'pinia'

import {
  closeAllDesktopNotifications,
  closeDesktopNotification,
} from '../services/desktop_notification_utils/desktop_notification_utils.js'
import {
  isValidNotification,
  maybeShowNotification,
} from '../services/notification_utils/notification_utils.js'
import { isStatusNotification } from '../services/notification_utils/notification_utils_sw.js'

import { useI18nStore } from 'src/stores/i18n.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useReportsStore } from 'src/stores/reports.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { dismissNotification, markNotificationsAsSeen } from 'src/api/user.js'

export const defaultState = () => ({
  desktopNotificationSilence: true,
  maxId: 0,
  minId: Number.POSITIVE_INFINITY,
  data: [],
  statusNotificationRelations: new WeakMap(),
  idStore: new Map(),
  loading: false,
})

export const useNotificationsStore = defineStore('notifications', {
  state: defaultState,
  actions: {
    clearNotifications() {
      const blankState = defaultState()

      Object.keys(defaultState()).forEach((k) => {
        this[k] = blankState[k]
      })
    },
    updateNotificationsMinMaxId(id) {
      this.maxId = id > this.maxId ? id : this.maxId
      this.minId = id < this.minId ? id : this.minId
    },
    setNotificationsLoading(value) {
      this.loading = value
    },
    setNotificationsSilence(value) {
      this.desktopNotificationSilence = value
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

      commit(
        'addNewUsers',
        validNotifications.map((notification) => notification.from_profile),
      )

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
  },
})
