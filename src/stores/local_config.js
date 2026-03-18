import { cloneDeep, set } from 'lodash'
import { defineStore } from 'pinia'
import { toRaw } from 'vue'

import { useInstanceStore } from 'src/stores/instance'

import { defaultState as configDefaultState } from 'src/modules/default_config_state'

export const defaultState = {
  prefsStorage: {
    ...configDefaultState,
  },
  tempStorage: {
    ...configDefaultState,
  },
}

export const useLocalConfigStore = defineStore('local_config', {
  state() {
    return cloneDeep(defaultState)
  },
  actions: {
    set({ path, value }) {
      set(this.prefsStorage, path, value)
    },
    setTemporarily({ path, value }) {
      set(this.tempStorage, path, value)
    },
    unsetTemporarily({ path, value }) {
      set(this.tempStorage, path, undefined)
    },
    unset({ path, value }) {
      set(this.prefsStorage, path, undefined)
    },
    clearLocalConfig() {
      Object.keys(this).forEach((k) => {
        this.prefsStorage[k] = undefined
        this.tempStorage[k] = undefined
      })
    },
  },
  persist: {
    afterLoad(state) {
      return {
        prefsStorage: state.prefsStorage ?? { ...configDefaultState },
        tempStorage: { ...configDefaultState },
      }
    },
  },
})
