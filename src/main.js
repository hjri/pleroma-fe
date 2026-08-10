/* global process */

import { createPinia } from 'pinia'
import { createStore } from 'vuex'

import 'custom-event-polyfill'
import './lib/event_target_polyfill.js'

// Polyfill for Array.prototype.toSorted (ES2023)
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function (compareFn) {
    return [...this].sort(compareFn)
  }
}

import { createI18n } from 'vue-i18n'

import afterStoreSetup from './boot/after_store.js'
import messages from './i18n/messages.js'
import createPersistedState, {
  piniaPersistPlugin,
} from './lib/persisted_state.js'
import {
  piniaPushNotificationsPlugin,
  vuexPushNotificationsPlugin,
} from './lib/push_notifications_plugin.js'
import vuexModules from './modules/index.js'

import { piniaLanguagePlugin } from 'src/lib/language.js'
import { piniaStylePlugin } from 'src/lib/style.js'

const currentLocale = (window.navigator.language || 'en').split('-')[0]

const i18n = createI18n({
  // By default, use the browser locale, we will update it if neccessary
  locale: 'en',
  fallbackLocale: 'en',
  messages: messages.default,
})

messages.setLanguage(i18n.global, currentLocale)

const persistedStateOptions = {
  paths: ['oauth', 'config'],
}

;(async () => {
  const isFox = Math.floor(Math.random() * 2) > 0 ? '_fox' : ''

  const splashError = (i18n, e) => {
    const throbber = document.querySelector('#throbber')
    throbber.addEventListener('animationend', () => {
      document.querySelector('#mascot').src =
        `/static/pleromatan_orz${isFox}.png`
    })
    throbber.classList.add('dead')
    document.querySelector('#status').textContent =
      i18n.global.t('splash.error')
    console.error('PleromaFE failed to initialize: ', e)
    document.querySelector('#statusError').textContent = e
    document.querySelector('#statusStack').textContent = e.stack
    document.querySelector('#statusError').style = 'display: block'
    document.querySelector('#statusStack').style = 'display: block'
  }

  window.splashError = (e) => splashError(i18n, e)
  window.splashUpdate = (key) => {
    if (document.querySelector('#status')) {
      document.querySelector('#status').textContent = i18n.global.t(key)
    }
  }

  try {
    let storageError
    const plugins = [vuexPushNotificationsPlugin]
    const pinia = createPinia()
    pinia.use(piniaPersistPlugin())
    pinia.use(piniaLanguagePlugin)
    pinia.use(piniaStylePlugin)
    pinia.use(piniaPushNotificationsPlugin)

    try {
      const persistedState = await createPersistedState(persistedStateOptions)
      plugins.push(persistedState)
    } catch (e) {
      console.error('Storage error', e)
      storageError = e
    }
    document.querySelector('#splash').classList.remove('initial-hidden')
    document.querySelector('#mascot').src =
      `/static/pleromatan_apology${isFox}_small.webp`
    document.querySelector('#status').removeAttribute('class')
    document.querySelector('#status').textContent =
      i18n.global.t('splash.loading')
    document.querySelector('#splash-credit').textContent = i18n.global.t(
      'update.art_by',
      { linkToArtist: 'pipivovott' },
    )
    const store = createStore({
      modules: vuexModules,
      plugins,
      options: {
        devtools: process.env.NODE_ENV !== 'production',
      },
      strict: false, // Socket modifies itself, let's ignore this for now.
      // strict: process.env.NODE_ENV !== 'production'
    })
    window.vuex = store
    // Temporarily passing pinia and vuex stores along with storageError result until migration is fully complete.
    return await afterStoreSetup({ pinia, store, storageError, i18n })
  } catch (e) {
    splashError(i18n, e)
  }
})()

// These are inlined by webpack's DefinePlugin
// biome-ignore-start lint: added in build process
window.___pleromafe_mode = process.env
window.___pleromafe_commit_hash = COMMIT_HASH
window.___pleromafe_dev_overrides = DEV_OVERRIDES
// biome-ignore-end lint: added in build process
