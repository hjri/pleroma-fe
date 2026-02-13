import { useI18nStore } from 'src/stores/i18n.js'
import { useEmojiStore } from 'src/stores/emoji.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import messages from 'src/i18n/messages'
import localeService from 'src/services/locale/locale.service.js'

const BACKEND_LANGUAGE_COOKIE_NAME = 'userLanguage'

export const piniaLanguagePlugin = ({ store, options }) => {
  if (store.$id === 'sync_config') {
    store.$onAction(({ name, args }) => {
      if (name === 'setPreference') {
        const { path, value } = args[0]
        if (path === 'simple.interfaceLanguage') {
          useI18nStore().setLanguage(value)
          const value =
                originalValue || useSyncConfigStore().mergedConfig.interfaceLanguage

          messages.setLanguage(this.i18n, value)
          useEmojiStore().loadUnicodeEmojiData(value)
          Cookies.set(
            BACKEND_LANGUAGE_COOKIE_NAME,
            localeService.internalToBackendLocaleMulti(value),
          )
        }
      }
    })
  }
}
