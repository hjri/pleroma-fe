import { Socket } from 'phoenix'

import { maybeShowChatNotification } from '../services/chat_utils/chat_utils.js'

import { useChatsStore } from 'src/stores/chats.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useShoutStore } from 'src/stores/shout.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import {
  getMastodonSocketURI,
  ProcessedWS,
  WSConnectionStatus,
} from 'src/api/websocket.js'
import followRequestFetcher from 'src/services/follow_request_fetcher/follow_request_fetcher.service'
import notificationsFetcher from 'src/services/notifications_fetcher/notifications_fetcher.service.js'

const retryTimeout = (multiplier) => 1000 * multiplier

const api = {
  state: {
    retryMultiplier: 1,
    fetchers: {},
    socket: null,
    mastoUserSocket: null,
    mastoUserSocketStatus: null,
    followRequests: [],
  },
  getters: {
    followRequestCount: (state) => state.followRequests.length,
  },
  mutations: {
    addFetcher(state, { fetcherName, fetcher }) {
      state.fetchers[fetcherName] = fetcher
    },
    removeFetcher(state, { fetcherName }) {
      state.fetchers[fetcherName].stop()
      delete state.fetchers[fetcherName]
    },
    setWsToken(state, token) {
      state.wsToken = token
    },
    setSocket(state, socket) {
      state.socket = socket
    },
    setFollowRequests(state, value) {
      state.followRequests = value
    },
    setMastoUserSocketStatus(state, value) {
      state.mastoUserSocketStatus = value
    },
    incrementRetryMultiplier(state) {
      state.retryMultiplier = Math.max(++state.retryMultiplier, 3)
    },
    resetRetryMultiplier(state) {
      state.retryMultiplier = 1
    },
  },
  actions: {
    /**
     * Global MastoAPI socket control, in future should disable ALL sockets/(re)start relevant sockets
     *
     * @param {Boolean} [initial] - whether this enabling happened at boot time or not
     */
    enableMastoSockets(store, initial) {
      const { state, dispatch, commit } = store
      // Do not initialize unless nonexistent or closed
      if (
        state.mastoUserSocket &&
        ![WebSocket.CLOSED, WebSocket.CLOSING].includes(
          state.mastoUserSocket.getState(),
        )
      ) {
        return
      }
      if (initial) {
        commit('setMastoUserSocketStatus', WSConnectionStatus.STARTING_INITIAL)
      } else {
        commit('setMastoUserSocketStatus', WSConnectionStatus.STARTING)
      }
      return dispatch('startMastoUserSocket')
    },
    disableMastoSockets(store) {
      const { state, dispatch, commit } = store
      if (!state.mastoUserSocket) return
      commit('setMastoUserSocketStatus', WSConnectionStatus.DISABLED)
      return dispatch('stopMastoUserSocket')
    },

    // Notifications
    startFetchingNotifications(store) {
      if (store.state.fetchers.notifications) return
      const fetcher = notificationsFetcher.startFetching({
        credentials: useOAuthStore().token,
      })
      store.commit('addFetcher', { fetcherName: 'notifications', fetcher })
    },
    stopFetchingNotifications(store) {
      const fetcher = store.state.fetchers.notifications
      if (!fetcher) return
      store.commit('removeFetcher', { fetcherName: 'notifications', fetcher })
    },

    // Follow requests
    startFetchingFollowRequests(store) {
      if (store.state.fetchers.followRequests) return
      const fetcher = followRequestFetcher.startFetching({
        store,
        credentials: useOAuthStore().token,
      })

      store.commit('addFetcher', { fetcherName: 'followRequests', fetcher })
    },
    stopFetchingFollowRequests(store) {
      const fetcher = store.state.fetchers.followRequests
      if (!fetcher) return
      store.commit('removeFetcher', { fetcherName: 'followRequests', fetcher })
    },

    // Pleroma websocket
    setWsToken(store, token) {
      store.commit('setWsToken', token)
    },
    initializeSocket({ commit, state, rootState }) {
      // Set up websocket connection
      const token = state.wsToken
      if (
        useInstanceCapabilitiesStore().shoutAvailable &&
        token !== undefined &&
        state.socket === null
      ) {
        const socket = new Socket('/socket', { params: { token } })
        socket.connect()

        commit('setSocket', socket)
        useShoutStore().initializeShout(socket)
      }
    },
    disconnectFromSocket({ commit, state }) {
      state.socket?.disconnect()
      commit('setSocket', null)
    },
  },
}

export default api
