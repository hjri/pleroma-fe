import { Socket } from 'phoenix'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useShoutStore } from 'src/stores/shout.js'

import followRequestFetcher from 'src/services/follow_request_fetcher/follow_request_fetcher.service'

const api = {
  state: {
    fetchers: {},
    socket: null,
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
  },
  actions: {
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
