import { useEmojiStore } from 'src/stores/emoji.js'
import { useI18nStore } from 'src/stores/i18n.js'

export const piniaLanguagePlugin = ({ store, options }) => {
  if (store.$id === 'sync_config') {
    store.$onAction(({ name, args }) => {
      if (name === 'setPreference') {
        const { path, value } = args[0]
        if (path === 'simple.interfaceLanguage') {
          useI18nStore().setLanguage(value)
          useEmojiStore().loadUnicodeEmojiData(value)
        }
      }
    })
  }
}
