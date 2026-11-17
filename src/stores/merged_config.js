import { defineStore } from 'pinia'

import { ROOT_CONFIG } from 'src/stores/default_state/default_config_state.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

export const useMergedConfigStore = defineStore('merged_config', {
  /* Some logic behind all this:
   *
   * There are 4 config stores:
   * - Local overrides (LocalConfigStore)
   * - Synchronized overrides (SyncConfigStore)
   * - Instance defaults (InstanceStore)
   * - Built-in defaults (ROOT_CONFIG)
   *
   * The override logic at a glance is
   *   Local -> Sync -> Instance -> Built-in
   * However logic for overrides is a bit tricky.
   * Local SHOULD be able to override Sync no matter what, and
   * that means you should be able to set Local to "undefined"
   * which would override Sync and force defaults to be used
   * So in reality the logic is more like
   *   ( Local -> Sync ) -> Instance -> Built-in
   *
   * Another bit is that technically setting can be a null, so
   * we can't really use the ?? operator and have to explicitly
   * check for `=== undefined`
   */
  getters: {
    mergedConfig: (state) => {
      const overrides = state.mergedConfigWithoutDefaults
      const defaults = state.mergedConfigDefault

      return Object.fromEntries(
        Object.keys(defaults).map((key) => {
          const override = overrides[key]
          const defaultValue = defaults[key]

          return override !== undefined ? [key, override] : [key, defaultValue]
        }),
      )
    },
    mergedConfigDefault: () => {
      const instancePrefs = useInstanceStore().prefsStorage

      const getDefault = (k) => {
        const value = instancePrefs[k]

        return value !== undefined ? value : ROOT_CONFIG[k]
      }

      return Object.fromEntries(
        Object.keys(ROOT_CONFIG).map((k) => [k, getDefault(k)]),
      )
    },
    mergedConfigWithoutDefaults: () => {
      const localPrefs = useLocalConfigStore().mergedConfig
      const syncPrefs = useSyncConfigStore().prefsStorage.simple
      const keys = new Set([
        ...Object.keys(localPrefs),
        ...Object.keys(syncPrefs),
      ])

      const definedIn = (k) => ({
        local: Object.hasOwn(localPrefs, k),
        sync: syncPrefs[k] !== undefined,
      })

      const getValue = (k) => {
        const { local, sync } = definedIn(k)

        if (local) {
          return localPrefs[k]
        } else if (sync) {
          return syncPrefs[k]
        } else {
          return undefined
        }
      }

      return Object.fromEntries([...keys].map((k) => [k, getValue(k)]))
    },
  },
})
