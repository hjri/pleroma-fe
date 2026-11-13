import { defineStore } from 'pinia'

import {
  LOCAL_ONLY_KEYS,
  ROOT_CONFIG,
} from 'src/stores/default_state/default_config_state.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

export const useMergedConfigStore = defineStore('merged_config', {
  getters: {
    mergedConfig: (state) => {
      const overrides = state.mergedConfigWithoutDefaults
      const defaults = state.mergedConfigDefault

      return Object.fromEntries(
        Object.keys(defaults).map((key) => {
          const override = overrides[key]
          const defaultValue = defaults[key]

          return override !== undefined
            ? [key, override]
            : [key, defaultValue]
        })
      )
    },
    mergedConfigDefault: () => {
      const instancePrefs = useInstanceStore().prefsStorage

      const getDefault = (k) => {
        const value = instancePrefs[k]

        return value !== undefined
          ? value
          : ROOT_CONFIG[k]
      }

      return Object.fromEntries(
        Object.keys(ROOT_CONFIG).map((k) => [k, getDefault(k)]),
      )
    },
    mergedConfigWithoutDefaults: () => {
      const localPrefs = useLocalConfigStore().mergedConfig
      const syncPrefs = useSyncConfigStore().prefsStorage
      const keys = new Set([
        ...Object.keys(localPrefs),
        ...Object.keys(syncPrefs),
      ])

      const definedIn = (k) => ({
        local: Object.hasOwn(localPrefs, k),
        sync: syncPrefs.simple[k] !== undefined,
      })

      const getValue = (k) => {
        const { local, sync } = definedIn(k)

        if (local) {
          return localPrefs[k]
        } else if (sync) {
          return syncPrefs.simple[k]
        } else {
          return undefined
        }
      }

      return Object.fromEntries([...keys].map((k) => [k, getValue(k)]))
    },
  },
})
