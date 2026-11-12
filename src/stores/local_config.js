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
  prefsStorage: {
    ...makeUndefined({
      ...INSTANCE_DEFAULT_CONFIG,
      ...LOCAL_DEFAULT_CONFIG,
    }),
  },
  tempStorage: {
    ...makeUndefined({
      ...INSTANCE_DEFAULT_CONFIG,
      ...LOCAL_DEFAULT_CONFIG,
    }),
  },
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
        this.prefsStorage[k] = undefined
        this.tempStorage[k] = undefined
      })
    },
  },
  getters: {
    mergedConfig() {
      return Object.fromEntries(
        Object.keys(this.prefsStorage).map((key) => {
          return [key, this.tempStorage[key] ?? this.prefsStorage[key]]
        })
      )
    },
  },
  persist: {
    afterLoad(state) {
      return {
        prefsStorage: state.prefsStorage ?? {
          ...makeUndefined(LOCAL_DEFAULT_CONFIG),
        },
        tempStorage: { ...makeUndefined(LOCAL_DEFAULT_CONFIG) },
      }
    },
  },
})
