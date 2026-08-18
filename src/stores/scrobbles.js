import { defineStore } from 'pinia'
import {
  fetchScrobbles,
} from 'src/api/public.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

export const defaultState = () => ({
  scrobblesNextFetch: new Map(),
})

export const useScrobblesStore = defineStore('scrobbles', {
  state: defaultState,
  actions: {
    getLatestScrobble(userId) {
      const scrobblesSupport =
            useInstanceCapabilitiesStore().pleromaScrobblesAvailable

      if (!scrobblesSupport) {
        return
      }

      if (this.scrobblesNextFetch.get(userId) > Date.now()) {
        return
      }

      this.scrobblesNextFetch.set(userId, Date.now() + 24 * 60 * 60 * 1000)

      fetchScrobbles({ accountId: userId })
        .then(({ data: scrobbles }) => {
          useUsersStore().findUser(userId).latestScrobble = scrobbles[0]

          this.scrobblesNextFetch.set(user.id, Date.now() + 60 * 1000)
        })
        .catch((e) => {
          useInstanceCapabilitiesStore().set('pleromaScrobblesAvailable', false)
          console.warn('cannot fetch scrobbles', e)
        })
    }
  }
})
