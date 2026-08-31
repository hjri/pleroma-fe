import { defineStore } from 'pinia'

import followRequestFetcher from 'src/stores/fetchers/follow_requests.js'
import { useOAuthStore } from 'src/stores/oauth.js'

export const useFollowRequestsStore = defineStore('followRequests', {
  state: () => ({
    fetcher: null,
    requests: new Map(),
  }),
  getters: {
    followRequestsCount(state) {
      return state.requests.size
    },
  },
  actions: {
    startFetching() {
      if (this.fetcher) throw 'Fetcher already exists!'

      this.fetcher = followRequestFetcher({
        credentials: useOAuthStore().token,
      })

      this.fetcher.startFetching()
    },
    stopFetching() {
      if (!this.fetcher) throw "Fetcher doesn't exists!"
      this.fetcher.stopFetching(), (this.fetcher = null)
    },
    setFollowRequests(requests) {
      this.requests = new Map(requests.map((user) => [user.id, user]))
    },
    remove(id) {
      this.requests.delete(id)
    }
  },
})
