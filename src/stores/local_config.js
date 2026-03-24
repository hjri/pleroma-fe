import { cloneDeep, set } from 'lodash'
import { defineStore } from 'pinia'
import { toRaw } from 'vue'

import { useInstanceStore } from 'src/stores/instance'

import {
  LOCAL_DEFAULT_CONFIG,
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
  validateSetting,
} from 'src/modules/default_config_state'

export const defaultState = {
  prefsStorage: {
    ...LOCAL_DEFAULT_CONFIG,
  },
  tempStorage: {
    ...LOCAL_DEFAULT_CONFIG,
  },
}

export const useLocalConfigStore = defineStore('local_config', {
  state() {
    return cloneDeep(defaultState)
  },
  actions: {
    set({ path, value }) {
      const definition = LOCAL_DEFAULT_CONFIG_DEFINITIONS[path]

      const finalValue = validateSetting({
        path,
        value,
        definition,
        throwError: false,
        defaultState: LOCAL_DEFAULT_CONFIG,
      })

      set(this.prefsStorage, path, finalValue)
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
        prefsStorage: state.prefsStorage ?? { ...LOCAL_DEFAULT_CONFIG },
        tempStorage: { ...LOCAL_DEFAULT_CONFIG },
      }
    },
  },
})
