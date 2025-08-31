import apiService from '../services/api/api.service.js'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

import {
  isStatusNotification,
  isValidNotification,
  maybeShowNotification
} from '../services/notification_utils/notification_utils.js'

import {
  closeDesktopNotification,
  closeAllDesktopNotifications
} from '../services/desktop_notification_utils/desktop_notification_utils.js'

import { useReportsStore } from 'src/stores/reports.js'

const emptyNotifications = () => ({
  desktopNotificationSilence: true,
  maxId: 0,
  minId: Number.POSITIVE_INFINITY,
  data: [],
  idStore: {},
  loading: false
})

export const defaultState = () => ({
  ...emptyNotifications()
})

export const notifications = {
  state: defaultState(),
  mutations: {
    addNewNotifications (state, { notifications }) {
      notifications.forEach(notification => {
        state.data.push(notification)
        state.idStore[notification.id] = notification
      })
    },
    clearNotifications (state) {
      const blankState = defaultState()
      Object.keys(state).forEach(k => {
        state[k] = blankState[k]
      })
    },
    updateNotificationsMinMaxId (state, id) {
      state.maxId = id > state.maxId ? id : state.maxId
      state.minId = id < state.minId ? id : state.minId
    },
    setNotificationsLoading (state, { value }) {
      state.loading = value
    },
    setNotificationsSilence (state, { value }) {
      state.desktopNotificationSilence = value
    },
    markNotificationsAsSeen (state) {
      state.data.forEach((notification) => {
        notification.seen = true
      })
    },
    markSingleNotificationAsSeen (state, { id }) {
      const notification = state.idStore[id]
      if (notification) notification.seen = true
    },
    dismissNotification (state, { id }) {
      state.data = state.data.filter(n => n.id !== id)
      delete state.idStore[id]
    },
    updateNotification (state, { id, updater }) {
      const notification = state.idStore[id]
      notification && updater(notification)
    }
  },
  actions: {
    addNewNotifications (store, { notifications }) {
      const { commit, dispatch, state, rootState } = store
      const validNotifications = notifications.filter((notification) => {
        // If invalid notification, update ids but don't add it to store
        if (!isValidNotification(notification)) {
          console.error('Invalid notification:', notification)
          commit('updateNotificationsMinMaxId', notification.id)
          return false
        }
        return true
      })

      const statusNotifications = validNotifications.filter(notification => isStatusNotification(notification.type) && notification.status)

      // Synchronous commit to add all the statuses
      commit('addNewStatuses', { statuses: statusNotifications.map(notification => notification.status) })

      // Update references to statuses in notifications to ones in the store
      statusNotifications.forEach(notification => {
        const id = notification.status.id
        const referenceStatus = rootState.statuses.allStatusesObject[id]

        if (referenceStatus) {
          notification.status = referenceStatus
        }
      })

      validNotifications.forEach(notification => {
        if (notification.type === 'pleroma:report') {
          useReportsStore().addReport(notification.report)
        }

        if (notification.type === 'pleroma:emoji_reaction') {
          dispatch('fetchEmojiReactionsBy', notification.status.id)
        }

        // Only add a new notification if we don't have one for the same action
        // eslint-disable-next-line no-prototype-builtins
        if (!state.idStore.hasOwnProperty(notification.id)) {
          commit('updateNotificationsMinMaxId', notification.id)
          commit('addNewNotifications', { notifications: [notification] })

          maybeShowNotification(
            store,
            Object.values(useServerSideStorageStore().prefsStorage.simple.muteFilters),
            notification
          )
        } else if (notification.seen) {
          state.idStore[notification.id].seen = true
        }
      })
    },
    notificationClicked ({ state, dispatch }, { id }) {
      const notification = state.idStore[id]
      const { type, seen } = notification

      if (!seen) {
        switch (type) {
          case 'mention':
          case 'pleroma:report':
          case 'follow_request':
            break
          default:
            dispatch('markSingleNotificationAsSeen', { id })
        }
      }
    },
    setNotificationsLoading ({ commit }, { value }) {
      commit('setNotificationsLoading', { value })
    },
    setNotificationsSilence ({ commit }, { value }) {
      commit('setNotificationsSilence', { value })
    },
    markNotificationsAsSeen ({ rootState, state, commit }) {
      commit('markNotificationsAsSeen')
      apiService.markNotificationsAsSeen({
        id: state.maxId,
        credentials: rootState.users.currentUser.credentials
      }).then(() => {
        closeAllDesktopNotifications(rootState)
      })
    },
    markSingleNotificationAsSeen ({ rootState, commit }, { id }) {
      commit('markSingleNotificationAsSeen', { id })
      apiService.markNotificationsAsSeen({
        single: true,
        id,
        credentials: rootState.users.currentUser.credentials
      }).then(() => {
        closeDesktopNotification(rootState, { id })
      })
    },
    dismissNotificationLocal ({ commit }, { id }) {
      commit('dismissNotification', { id })
    },
    dismissNotification ({ rootState, commit }, { id }) {
      commit('dismissNotification', { id })
      rootState.api.backendInteractor.dismissNotification({ id })
    },
    updateNotification ({ commit }, { id, updater }) {
      commit('updateNotification', { id, updater })
    }
  }
}

export default notifications
