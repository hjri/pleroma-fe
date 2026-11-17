import { cloneDeep, set, unset } from 'lodash-es'
import { defineStore } from 'pinia'

import {
  INSTANCE_DEFAULT_CONFIG,
  INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
  LOCAL_DEFAULT_CONFIG,
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
  makeUndefined,
  validateSetting,
} from 'src/stores/default_state/default_config_state.js'

export const defaultState = {
  prefsStorage: {},
  tempStorage: {},
}

export const useLocalConfigStore = defineStore('local_config', {
  state() {
    return cloneDeep(defaultState)
  },
  actions: {
    set({ path, value }) {
      const definition =
        LOCAL_DEFAULT_CONFIG_DEFINITIONS[path] ??
        INSTANCE_DEFAULT_CONFIG_DEFINITIONS[path]

      const finalValue = validateSetting({
        path,
        value,
        definition,
        throwError: false,
        defaultState: {
          ...INSTANCE_DEFAULT_CONFIG,
          ...LOCAL_DEFAULT_CONFIG,
        },
      })

      set(this.prefsStorage, path, finalValue)
    },
    setTemporarily({ path, value }) {
      set(this.tempStorage, path, value)
    },
    unsetTemporarily({ path }) {
      unset(this.tempStorage, path)
    },
    unset({ path, value }) {
      unset(this.prefsStorage, path)
    },
    clearLocalConfig() {
      Object.keys(this).forEach((k) => {
        delete this.prefsStorage[k]
        delete this.tempStorage[k]
      })
    },
  },
  getters: {
    mergedConfig() {
      const keys = new Set([
        ...Object.keys(this.prefsStorage),
        ...Object.keys(this.tempStorage),
      ])

      return Object.fromEntries(
        [...keys].map((key) => [
          key,
          Object.hasOwn(this.tempStorage, key)
            ? this.tempStorage[key]
            : this.prefsStorage[key]
        ])
      )
    },
  },
  persist: {
    afterLoad(state) {
      return {
        prefsStorage: state.prefsStorage ?? {},
        tempStorage: {},
      }
    },
  },
})
