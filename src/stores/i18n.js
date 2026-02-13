import Cookies from 'js-cookie'
import { defineStore } from 'pinia'

import { useEmojiStore } from 'src/stores/emoji.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import messages from 'src/i18n/messages'
import localeService from 'src/services/locale/locale.service.js'

const BACKEND_LANGUAGE_COOKIE_NAME = 'userLanguage'

export const useI18nStore = defineStore('i18n', {
  state: () => ({
    i18n: null,
  }),
  actions: {
    setI18n(newI18n) {
      this.$patch({
        i18n: newI18n.global,
      })
    },
    setLanguage(originalValue) {
      const value =
        originalValue || useSyncConfigStore().mergedConfig.interfaceLanguage

      messages.setLanguage(this.i18n, value)
      useEmojiStore().loadUnicodeEmojiData(value)
      Cookies.set(
        BACKEND_LANGUAGE_COOKIE_NAME,
        localeService.internalToBackendLocaleMulti(value),
      )
    },
  },
})
