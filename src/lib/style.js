import { applyStyleConfig } from 'src/services/style_setter/style_setter.js'

const APPEARANCE_SETTINGS_KEYS = new Set(
  [
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
  ].map((x) => 'simple.' + x),
)

export const piniaStylePlugin = ({ store, options }) => {
  if (store.$id === 'sync_config') {
    store.$onAction(({ name, args, after }) => {
      if (name === 'setPreference') {
        const { path } = args[0]
        if (APPEARANCE_SETTINGS_KEYS.has(path)) {
          after(() => applyStyleConfig(store.mergedConfig))
        }
      }
    })
  }
}
