import { Socket } from 'phoenix'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useShoutStore } from 'src/stores/shout.js'

const api = {
  state: {
    fetchers: {},
    socket: null,
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
  },
  actions: {
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
