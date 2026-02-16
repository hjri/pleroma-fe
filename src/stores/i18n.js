import Cookies from 'js-cookie'
import messages from 'src/i18n/messages'
import localeService from 'src/services/locale/locale.service.js'
import { defineStore } from 'pinia'

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
    setLanguage(value) {
      messages.setLanguage(this.i18n, value)
      Cookies.set(
        BACKEND_LANGUAGE_COOKIE_NAME,
        localeService.internalToBackendLocaleMulti(value),
      )
    }
  },
})
