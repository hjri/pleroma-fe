import { defineStore } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import {
  INSTANCE_DEFAULT_CONFIG,
  LOCAL_DEFAULT_CONFIG,
  THEME_CONFIG,
  LOCAL_ONLY_KEYS,
} from 'src/modules/default_config_state.js'

const ROOT_CONFIG = {
  ...INSTANCE_DEFAULT_CONFIG,
  ...LOCAL_DEFAULT_CONFIG,
  ...THEME_CONFIG,
}

export const useMergedConfigStore = defineStore('merged_config', {
  getters: {
    mergedConfig: () => {
      const instancePrefs = useInstanceStore().prefsStorage
      const tempPrefs = useLocalConfigStore().tempStorage
      const localPrefs = useLocalConfigStore().prefsStorage
      const syncPrefs = useSyncConfigStore().prefsStorage

      const getValue = (k) =>
        tempPrefs[k] ?? localPrefs[k] ?? syncPrefs.simple[k]
      const getDefault = (k) => instancePrefs[k] ?? ROOT_CONFIG[k]

      const result = Object.fromEntries(
        Object.keys(ROOT_CONFIG).map((k) => [
          k,
          getValue(k) ?? getDefault(k),
        ]),
      )
      return result
    },
    mergedConfigDefault: () => {
      const instancePrefs = useInstanceStore().prefsStorage

      const getDefault = (k) => instancePrefs[k] ?? ROOT_CONFIG[k]

      const result = Object.fromEntries(
        Object.keys(ROOT_CONFIG).map((k) => [
          k,
          getDefault(k),
        ]),
      )
      return result
    },
    mergedConfigWithoutDefaults: () => {
      const instancePrefs = useInstanceStore().prefsStorage
      const tempPrefs = useLocalConfigStore().tempStorage
      const localPrefs = useLocalConfigStore().prefsStorage
      const syncPrefs = useSyncConfigStore().prefsStorage

      const getValue = (k) =>
        tempPrefs[k] ?? localPrefs[k] ?? syncPrefs.simple[k] ?? instancePrefs[k]

      const result = Object.fromEntries(
        Object.keys(ROOT_CONFIG).map(([k, value]) => [
          k,
          getValue(k),
        ]),
      )
      return result
    },
  },
})
