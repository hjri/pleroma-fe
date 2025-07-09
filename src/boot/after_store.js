/* global process */
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import vClickOutside from 'click-outside-vue3'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false

import App from '../App.vue'
import routes from './routes'
import VBodyScrollLock from 'src/directives/body_scroll_lock'

import { windowWidth, windowHeight } from '../services/window_utils/window_utils'
import backendInteractorService from '../services/backend_interactor_service/backend_interactor_service.js'
import { applyConfig } from '../services/style_setter/style_setter.js'
import FaviconService from '../services/favicon_service/favicon_service.js'
import { initServiceWorker, updateFocus } from '../services/sw/sw.js'

import { useOAuthStore } from 'src/stores/oauth'
import { useI18nStore } from 'src/stores/i18n'
import { useInterfaceStore } from 'src/stores/interface'
import { useAnnouncementsStore } from 'src/stores/announcements'
import { useAuthFlowStore } from 'src/stores/auth_flow'

let staticInitialResults = null

const parsedInitialResults = () => {
  if (!document.getElementById('initial-results')) {
    return null
  }
  if (!staticInitialResults) {
    staticInitialResults = JSON.parse(document.getElementById('initial-results').textContent)
  }
  return staticInitialResults
}

const decodeUTF8Base64 = (data) => {
  const rawData = atob(data)
  const array = Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
  const text = new TextDecoder().decode(array)
  return text
}

const preloadFetch = async (request) => {
  const data = parsedInitialResults()
  if (!data || !data[request]) {
    return window.fetch(request)
  }
  const decoded = decodeUTF8Base64(data[request])
  const requestData = JSON.parse(decoded)
  return {
    ok: true,
    json: () => requestData,
    text: () => requestData
  }
}

const getInstanceConfig = async ({ store }) => {
  try {
    const res = await preloadFetch('/api/v1/instance')
    if (res.ok) {
      const data = await res.json()
      const textlimit = data.max_toot_chars
      const vapidPublicKey = data.pleroma.vapid_public_key

      store.dispatch('setInstanceOption', { name: 'pleromaExtensionsAvailable', value: data.pleroma })
      store.dispatch('setInstanceOption', { name: 'textlimit', value: textlimit })
      store.dispatch('setInstanceOption', { name: 'accountApprovalRequired', value: data.approval_required })
      store.dispatch('setInstanceOption', { name: 'birthdayRequired', value: !!data.pleroma?.metadata.birthday_required })
      store.dispatch('setInstanceOption', { name: 'birthdayMinAge', value: data.pleroma?.metadata.birthday_min_age || 0 })

      if (vapidPublicKey) {
        store.dispatch('setInstanceOption', { name: 'vapidPublicKey', value: vapidPublicKey })
      }
    } else {
      throw (res)
    }
  } catch (error) {
    console.error('Could not load instance config, potentially fatal')
    console.error(error)
  }
  // We should check for scrobbles support here but it requires userId
  // so instead we check for it where it's fetched (statuses.js)
}

const getBackendProvidedConfig = async () => {
  try {
    const res = await window.fetch('/api/pleroma/frontend_configurations')
    if (res.ok) {
      const data = await res.json()
      return data.pleroma_fe
    } else {
      throw (res)
    }
  } catch (error) {
    console.error('Could not load backend-provided frontend config, potentially fatal')
    console.error(error)
  }
}

const getStaticConfig = async () => {
  try {
    const res = await window.fetch('/static/config.json')
    if (res.ok) {
      return res.json()
    } else {
      throw (res)
    }
  } catch (error) {
    console.warn('Failed to load static/config.json, continuing without it.')
    console.warn(error)
    return {}
  }
}

const setSettings = async ({ apiConfig, staticConfig, store }) => {
  const overrides = window.___pleromafe_dev_overrides || {}
  const env = window.___pleromafe_mode.NODE_ENV

  // This takes static config and overrides properties that are present in apiConfig
  let config = {}
  if (overrides.staticConfigPreference && env === 'development') {
    console.warn('OVERRIDING API CONFIG WITH STATIC CONFIG')
    config = Object.assign({}, apiConfig, staticConfig)
  } else {
    config = Object.assign({}, staticConfig, apiConfig)
  }

  const copyInstanceOption = (name) => {
    store.dispatch('setInstanceOption', { name, value: config[name] })
  }

  copyInstanceOption('theme')
  copyInstanceOption('style')
  copyInstanceOption('palette')
  copyInstanceOption('embeddedToS')
  copyInstanceOption('nsfwCensorImage')
  copyInstanceOption('background')
  copyInstanceOption('hidePostStats')
  copyInstanceOption('hideBotIndication')
  copyInstanceOption('hideUserStats')
  copyInstanceOption('hideFilteredStatuses')
  copyInstanceOption('logo')

  store.dispatch('setInstanceOption', {
    name: 'logoMask',
    value: typeof config.logoMask === 'undefined'
      ? true
      : config.logoMask
  })

  store.dispatch('setInstanceOption', {
    name: 'logoMargin',
    value: typeof config.logoMargin === 'undefined'
      ? 0
      : config.logoMargin
  })
  copyInstanceOption('logoLeft')
  useAuthFlowStore().setInitialStrategy(config.loginMethod)

  copyInstanceOption('redirectRootNoLogin')
  copyInstanceOption('redirectRootLogin')
  copyInstanceOption('showInstanceSpecificPanel')
  copyInstanceOption('minimalScopesMode')
  copyInstanceOption('hideMutedPosts')
  copyInstanceOption('collapseMessageWithSubject')
  copyInstanceOption('scopeCopy')
  copyInstanceOption('subjectLineBehavior')
  copyInstanceOption('postContentType')
  copyInstanceOption('alwaysShowSubjectInput')
  copyInstanceOption('showFeaturesPanel')
  copyInstanceOption('hideSitename')
  copyInstanceOption('sidebarRight')
}

const getTOS = async ({ store }) => {
  try {
    const res = await window.fetch('/static/terms-of-service.html')
    if (res.ok) {
      const html = await res.text()
      store.dispatch('setInstanceOption', { name: 'tos', value: html })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load TOS\n", e)
  }
}

const getInstancePanel = async ({ store }) => {
  try {
    const res = await preloadFetch('/instance/panel.html')
    if (res.ok) {
      const html = await res.text()
      store.dispatch('setInstanceOption', { name: 'instanceSpecificPanelContent', value: html })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load instance panel\n", e)
  }
}

const getStickers = async ({ store }) => {
  try {
    const res = await window.fetch('/static/stickers.json')
    if (res.ok) {
      const values = await res.json()
      const stickers = (await Promise.all(
        Object.entries(values).map(async ([name, path]) => {
          const resPack = await window.fetch(path + 'pack.json')
          let meta = {}
          if (resPack.ok) {
            meta = await resPack.json()
          }
          return {
            pack: name,
            path,
            meta
          }
        })
      )).sort((a, b) => {
        return a.meta.title.localeCompare(b.meta.title)
      })
      store.dispatch('setInstanceOption', { name: 'stickers', value: stickers })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn("Can't load stickers\n", e)
  }
}

const getAppSecret = async ({ store }) => {
  const oauth = useOAuthStore()
  if (oauth.userToken) {
    store.commit('setBackendInteractor', backendInteractorService(oauth.getToken))
  }
}

const resolveStaffAccounts = ({ store, accounts }) => {
  const nicknames = accounts.map(uri => uri.split('/').pop())
  store.dispatch('setInstanceOption', { name: 'staffAccounts', value: nicknames })
}

const getNodeInfo = async ({ store }) => {
  try {
    let res = await preloadFetch('/nodeinfo/2.1.json')
    if (!res.ok) res = await preloadFetch('/nodeinfo/2.0.json')
    if (res.ok) {
      const data = await res.json()
      const metadata = data.metadata
      const features = metadata.features
      console.log(features)
      store.dispatch('setInstanceOption', { name: 'name', value: metadata.nodeName })
      store.dispatch('setInstanceOption', { name: 'registrationOpen', value: data.openRegistrations })
      store.dispatch('setInstanceOption', { name: 'mediaProxyAvailable', value: features.includes('media_proxy') })
      store.dispatch('setInstanceOption', { name: 'safeDM', value: features.includes('safe_dm_mentions') })
      store.dispatch('setInstanceOption', { name: 'shoutAvailable', value: features.includes('chat') })
      store.dispatch('setInstanceOption', { name: 'pleromaChatMessagesAvailable', value: features.includes('pleroma_chat_messages') })
      store.dispatch('setInstanceOption', {
        name: 'pleromaCustomEmojiReactionsAvailable',
        value:
          features.includes('pleroma_custom_emoji_reactions') ||
          features.includes('custom_emoji_reactions')
      })
      store.dispatch('setInstanceOption', { name: 'pleromaBookmarkFoldersAvailable', value: features.includes('pleroma:bookmark_folders') })
      store.dispatch('setInstanceOption', { name: 'gopherAvailable', value: features.includes('gopher') })
      store.dispatch('setInstanceOption', { name: 'pollsAvailable', value: features.includes('polls') })
      store.dispatch('setInstanceOption', { name: 'editingAvailable', value: features.includes('editing') })
      store.dispatch('setInstanceOption', { name: 'pollLimits', value: metadata.pollLimits })
      store.dispatch('setInstanceOption', { name: 'mailerEnabled', value: metadata.mailerEnabled })
      store.dispatch('setInstanceOption', { name: 'quotingAvailable', value: features.includes('quote_posting') })
      store.dispatch('setInstanceOption', { name: 'groupActorAvailable', value: features.includes('pleroma:group_actors') })
      store.dispatch('setInstanceOption', { name: 'blockExpiration', value: features.includes('pleroma:block_expiration') })
      store.dispatch('setInstanceOption', { name: 'localBubbleInstances', value: metadata.localBubbleInstances ?? [] })

      const uploadLimits = metadata.uploadLimits
      store.dispatch('setInstanceOption', { name: 'uploadlimit', value: parseInt(uploadLimits.general) })
      store.dispatch('setInstanceOption', { name: 'avatarlimit', value: parseInt(uploadLimits.avatar) })
      store.dispatch('setInstanceOption', { name: 'backgroundlimit', value: parseInt(uploadLimits.background) })
      store.dispatch('setInstanceOption', { name: 'bannerlimit', value: parseInt(uploadLimits.banner) })
      store.dispatch('setInstanceOption', { name: 'fieldsLimits', value: metadata.fieldsLimits })

      store.dispatch('setInstanceOption', { name: 'restrictedNicknames', value: metadata.restrictedNicknames })
      store.dispatch('setInstanceOption', { name: 'postFormats', value: metadata.postFormats })

      const suggestions = metadata.suggestions
      store.dispatch('setInstanceOption', { name: 'suggestionsEnabled', value: suggestions.enabled })
      store.dispatch('setInstanceOption', { name: 'suggestionsWeb', value: suggestions.web })

      const software = data.software
      store.dispatch('setInstanceOption', { name: 'backendVersion', value: software.version })
      store.dispatch('setInstanceOption', { name: 'backendRepository', value: software.repository })

      const priv = metadata.private
      store.dispatch('setInstanceOption', { name: 'private', value: priv })

      const frontendVersion = window.___pleromafe_commit_hash
      store.dispatch('setInstanceOption', { name: 'frontendVersion', value: frontendVersion })

      const federation = metadata.federation

      store.dispatch('setInstanceOption', {
        name: 'tagPolicyAvailable',
        value: typeof federation.mrf_policies === 'undefined'
          ? false
          : metadata.federation.mrf_policies.includes('TagPolicy')
      })

      store.dispatch('setInstanceOption', { name: 'federationPolicy', value: federation })
      store.dispatch('setInstanceOption', {
        name: 'federating',
        value: typeof federation.enabled === 'undefined'
          ? true
          : federation.enabled
      })

      const accountActivationRequired = metadata.accountActivationRequired
      store.dispatch('setInstanceOption', { name: 'accountActivationRequired', value: accountActivationRequired })

      const accounts = metadata.staffAccounts
      resolveStaffAccounts({ store, accounts })
    } else {
      throw (res)
    }
  } catch (e) {
    console.warn('Could not load nodeinfo')
    console.warn(e)
  }
}

const setConfig = async ({ store }) => {
  // apiConfig, staticConfig
  const configInfos = await Promise.all([getBackendProvidedConfig({ store }), getStaticConfig()])
  const apiConfig = configInfos[0]
  const staticConfig = configInfos[1]

  getAppSecret({ store })
  await setSettings({ store, apiConfig, staticConfig })
}

const checkOAuthToken = async ({ store }) => {
  const oauth = useOAuthStore()
  if (oauth.getUserToken) {
    return store.dispatch('loginUser', oauth.getUserToken)
  }
  return Promise.resolve()
}

const afterStoreSetup = async ({ pinia, store, storageError, i18n }) => {
  const app = createApp(App)
  // Must have app use pinia before we do anything that touches the store
  // https://pinia.vuejs.org/core-concepts/plugins.html#Introduction
  // "Plugins are only applied to stores created after the plugins themselves, and after pinia is passed to the app, otherwise they won't be applied."
  app.use(pinia)

  const waitForAllStoresToLoad = async () => {
    // the stores that do not persist technically do not need to be awaited here,
    // but that involves either hard-coding the stores in some place (prone to errors)
    // or writing another vite plugin to analyze which stores needs persisting (++load time)
    const allStores = import.meta.glob('../stores/*.js', { eager: true })
    if (process.env.NODE_ENV === 'development') {
      // do some checks to avoid common errors
      if (!Object.keys(allStores).length) {
        throw new Error('No stores are available. Check the code in src/boot/after_store.js')
      }
    }
    await Promise.all(
      Object.entries(allStores)
        .map(async ([name, mod]) => {
          const isStoreName = name => name.startsWith('use')
          if (process.env.NODE_ENV === 'development') {
            if (Object.keys(mod).filter(isStoreName).length !== 1) {
              throw new Error('Each store file must export exactly one store as a named export. Check your code in src/stores/')
            }
          }
          const storeFuncName = Object.keys(mod).find(isStoreName)
          if (storeFuncName && typeof mod[storeFuncName] === 'function') {
            const p = mod[storeFuncName]().$persistLoaded
            if (!(p instanceof Promise)) {
              throw new Error(`${name} store's $persistLoaded is not a Promise. The persist plugin is not applied.`)
            }
            await p
          } else {
            throw new Error(`Store module ${name} does not export a 'use...' function`)
          }
        }))
  }

  try {
    await waitForAllStoresToLoad()
  } catch (e) {
    console.error('Cannot load stores:', e)
    storageError = e
  }

  if (storageError) {
    useInterfaceStore().pushGlobalNotice({ messageKey: 'errors.storage_unavailable', level: 'error' })
  }

  useInterfaceStore().setLayoutWidth(windowWidth())
  useInterfaceStore().setLayoutHeight(windowHeight())

  FaviconService.initFaviconService()
  initServiceWorker(store)

  window.addEventListener('focus', () => updateFocus())

  const overrides = window.___pleromafe_dev_overrides || {}
  const server = (typeof overrides.target !== 'undefined') ? overrides.target : window.location.origin
  store.dispatch('setInstanceOption', { name: 'server', value: server })

  await setConfig({ store })
  try {
    await useInterfaceStore().applyTheme().catch((e) => { console.error('Error setting theme', e) })
  } catch (e) {
    window.splashError(e)
    return Promise.reject(e)
  }

  applyConfig(store.state.config, i18n.global)

  // Now we can try getting the server settings and logging in
  // Most of these are preloaded into the index.html so blocking is minimized
  await Promise.all([
    checkOAuthToken({ store }),
    getInstancePanel({ store }),
    getNodeInfo({ store }),
    getInstanceConfig({ store })
  ]).catch(e => Promise.reject(e))

  // Start fetching things that don't need to block the UI
  store.dispatch('fetchMutes')
  store.dispatch('loadDrafts')
  useAnnouncementsStore().startFetchingAnnouncements()
  getTOS({ store })
  getStickers({ store })

  const router = createRouter({
    history: createWebHistory(),
    routes: routes(store),
    scrollBehavior: (to, _from, savedPosition) => {
      if (to.matched.some(m => m.meta.dontScroll)) {
        return false
      }
      return savedPosition || { left: 0, top: 0 }
    }
  })

  useI18nStore().setI18n(i18n)

  app.use(router)
  app.use(store)
  app.use(i18n)

  // Little thing to get out of invalid theme state
  window.resetThemes = () => {
    useInterfaceStore().resetThemeV3()
    useInterfaceStore().resetThemeV3Palette()
    useInterfaceStore().resetThemeV2()
  }

  app.use(vClickOutside)
  app.use(VBodyScrollLock)
  app.use(VueVirtualScroller)

  app.component('FAIcon', FontAwesomeIcon)
  app.component('FALayers', FontAwesomeLayers)

  // remove after vue 3.3
  app.config.unwrapInjectedRef = true

  app.mount('#app')
  return app
}

export default afterStoreSetup
