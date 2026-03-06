import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { applyStyleConfig } from 'src/services/style_setter/style_setter.js'

const ACTIONS = new Set([
  'setPreference',
  'unsetPreference',
  'set',
  'unset',
  'setTemporarily',
  'unsetTemporarily',
])

const APPEARANCE_SETTINGS_KEYS = [
  'sidebarColumnWidth',
  'contentColumnWidth',
  'notifsColumnWidth',
  'themeEditorMinWidth',
  'textSize',
  'navbarSize',
  'panelHeaderSize',
  'forcedRoundness',
  'emojiSize',
  'emojiReactionsScale',
]
const MIXED_KEYS = new Set([
  ...APPEARANCE_SETTINGS_KEYS,
  ...APPEARANCE_SETTINGS_KEYS.map((x) => 'simple.' + x),
])

export const piniaStylePlugin = ({ store, options }) => {
  if (store.$id === 'sync_config' || store.$id === 'local_config') {
    store.$onAction(({ name, args, after }) => {
      if (ACTIONS.has(name)) {
        const { path } = args[0]
        if (MIXED_KEYS.has(path)) {
          after(() => applyStyleConfig(useSyncConfigStore().mergedConfig))
        }
      }
    })
  }
}
