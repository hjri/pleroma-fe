import {
  cloneDeep,
  set,
} from 'lodash'
import { defineStore } from 'pinia'
import { toRaw } from 'vue'

import { useInstanceStore } from 'src/stores/instance'

import { defaultState as configDefaultState } from 'src/modules/default_config_state'

export const defaultState = {
  prefsStorage: {
    ...configDefaultState,
  }
}

export const useLocalConfigStore = defineStore('local_config', {
  state() {
    return cloneDeep(defaultState)
  },
  actions: {
    set({ path, value }) {
      set(this.prefsStorage, path, value)
    },
    unset({ path, value }) {
      set(this.prefsStorage, path, undefined)
    },
    clearSyncConfig() {
      const blankState = { ...cloneDeep(defaultState) }
      Object.keys(this).forEach((k) => {
        this.prefsStorage[k] = blankState[k]
      })
    },
  },
  getters: {
    mergedConfig: (state) => {
      const instancePrefs = useInstanceStore().prefsStorage
      const result = Object.fromEntries(
        Object.entries(state.prefsStorage).map(([k, v]) => [
          k,
          v ?? instancePrefs[k],
        ]),
      )
      return result
    },
  },
  persist: {
    afterLoad(state) {
      return state
    },
  },
})
