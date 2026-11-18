import sum from 'hash-sum'
import { cloneDeep, set, unset } from 'lodash-es'
import { defineStore } from 'pinia'

import {
  applyTheme,
  getResourcesIndex,
  tryLoadCache,
} from '../services/style_setter/style_setter.js'
import { deserialize } from '../services/theme_data/iss_deserializer.js'
import {
  windowHeight,
  windowWidth,
} from '../services/window_utils/window_utils'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { WSConnectionStatus } from 'src/api/websocket.js'
import {
  registerPushNotifications,
  unregisterPushNotifications,
} from 'src/services/sw/sw.js'
import {
  CURRENT_VERSION,
  generatePreset,
} from 'src/services/theme_data/theme_data.service.js'
import { convertTheme2To3 } from 'src/services/theme_data/theme2_to_theme3.js'

const getNotificationPermission = async () => {
  const Notification = window.Notification

  if (!Notification) return null
  if (Notification.permission === 'default')
    return Notification.requestPermission()
  return Notification.permission
}

const GENERIC_FONT_NAMES = new Set([
  'serif',
  'sans-serif',
  'system-ui',
  'cursive',
  'fantasy',
  'math',
  'monospace',
])

export const useInterfaceStore = defineStore('interface', {
  state: () => ({
    localFonts: null,
    prefersDarkMode: null,
    themeApplied: false,
    themeChangeInProgress: false,
    themeVersion: 'v3',
    styleNameUsed: null,
    styleDataUsed: null,
    useStylePalette: false, // hack for applying styles from appearance tab
    paletteNameUsed: null,
    paletteDataUsed: null,
    themeNameUsed: null,
    themeDataUsed: null,
    adminFrontendConfig: null,
    temporaryChangesTimeoutId: null,
    temporaryChangesCountdown: -1, // used for temporary options that revert after a timeout
    temporaryChangesConfirm: () => {
      /* no-op */
    }, // used for applying temporary options
    temporaryChangesRevert: () => {
      /* no-op */
    }, // used for reverting temporary options
    settingsModalState: 'hidden',
    settingsModalLoadedUser: false,
    settingsModalLoadedAdmin: false,
    settingsModalTargetTab: null,
    settingsModalMode: 'user',
    settings: {
      currentSaveStateNotice: null,
      noticeClearTimeout: null,
      notificationPermission: null,
    },
    browserSupport: {
      cssFilter:
        window.CSS?.supports &&
        (window.CSS.supports('filter', 'drop-shadow(0 0)') ||
          window.CSS.supports('-webkit-filter', 'drop-shadow(0 0)')),
      localFonts: typeof window.queryLocalFonts === 'function',
    },
    layoutType: 'normal',
    globalNotices: [],
    globalError: null,
    layoutHeight: 0,
    lastTimeline: null,
    foreignProfileBackground: null,
  }),
  actions: {
    attachSocket() {
      const et = new EventTarget()
      const socket = {
        name: 'interface',
        et,
      }

      et.addEventListener('open', this.onStreamConnect)
      et.addEventListener('close', this.onStreamDisconnect)

      useStreamingStore().addSubscriber(socket)
    },
    onLogin() {
      getNotificationPermission().then((permission) =>
        useInterfaceStore().setNotificationPermission(permission),
      )

      this.setLayoutWidth(windowWidth())
      this.setLayoutHeight(windowHeight())
    },
    onLogout() {
      this.setLastTimeline('public-timeline')
      this.setLayoutWidth(windowWidth())
      this.setLayoutHeight(windowHeight())
    },
    onStreamConnect() {
      if (useStreamingStore().state !== WSConnectionStatus.STARTING_INITIAL) {
        this.pushGlobalNotice({
          level: 'success',
          messageKey: 'timeline.socket_reconnected',
          timeout: 5000,
        })
      }
    },
    onStreamDisconnect(closeEvent) {
      // hosted and never connected: nothing broke (an instance that refuses
      // sockets from this site is polled instead)
      if (useInstanceStore().hosted && !useStreamingStore().everOpened) return
      const intendedCodes = new Set([
        1000, // Normal (intended) closure
        1001, // Going away
      ])
      const { code } = closeEvent.original
      if (!intendedCodes.has(code)) {
        this.pushGlobalNotice({
          level: 'error',
          messageKey: 'timeline.socket_broke',
          messageArgs: [code],
          timeout: 5000,
        })
      }
    },
    setTemporaryChanges({ confirm, revert }) {
      this.temporaryChangesCountdown = 10
      this.temporaryChangesConfirm = confirm
      this.temporaryChangesRevert = revert
      const countdownFunc = () => {
        if (this.temporaryChangesCountdown <= 1) {
          this.temporaryChangesRevert()
          this.clearTemporaryChanges()
        } else {
          this.temporaryChangesCountdown--
          this.temporaryChangesTimeoutId = setTimeout(countdownFunc, 1000)
        }
      }
      this.temporaryChangesTimeoutId = setTimeout(countdownFunc, 1000)
    },
    clearTemporaryChanges() {
      this.temporaryChangesTimeoutId ??
        clearTimeout(this.temporaryChangesTimeoutId)
      this.temporaryChangesTimeoutId = null
      this.temporaryChangesCountdown = -1
      this.temporaryChangesConfirm = () => {
        /* no-op */
      }
      this.temporaryChangesRevert = () => {
        /* no-op */
      }
    },
    setPageTitle(option = '') {
      try {
        document.title = `${option} ${useInstanceStore().instanceIdentity.name}`
      } catch (error) {
        console.error(`${error}`)
      }
    },
    setForeignProfileBackground(url) {
      this.foreignProfileBackground = url
    },
    settingsSaved({ success, error }) {
      if (success) {
        if (this.noticeClearTimeout) {
          clearTimeout(this.noticeClearTimeout)
        }
        this.settings.currentSaveStateNotice = { error: false, data: success }
        this.settings.noticeClearTimeout = setTimeout(
          () => delete this.settings.currentSaveStateNotice,
          2000,
        )
      } else {
        this.settings.currentSaveStateNotice = { error: true, errorData: error }
      }
    },
    setNotificationPermission(permission) {
      this.notificationPermission = permission
    },
    closeSettingsModal() {
      this.settingsModalState = 'hidden'
    },
    openSettingsModal(value) {
      this.settingsModalMode = value
      this.settingsModalState = 'visible'
      if (value === 'user') {
        if (!this.settingsModalLoadedUser) {
          this.settingsModalLoadedUser = true
        }
      } else if (value === 'admin') {
        if (!this.settingsModalLoadedAdmin) {
          this.settingsModalLoadedAdmin = true
        }
      }
    },
    setSettingsModalState(newState) {
      const oldState = this.settingsModalState
      const legal = (() => {
        switch (oldState) {
          case 'minimized':
            return true
          case 'visible':
            return true
          case 'hidden':
            return newState === 'visible'
        }
      })()

      if (legal) {
        this.settingsModalState = newState
      }
    },
    toggleMinimizeSettingsModal() {
      switch (this.settingsModalState) {
        case 'minimized':
          this.settingsModalState = 'visible'
          return
        case 'visible':
          this.settingsModalState = 'minimized'
          return
        case 'hidden':
          return
        default:
          throw new Error(
            `Illegal minimization state of settings modal: ${this.settingsModalState}`,
          )
      }
    },
    clearSettingsModalTargetTab() {
      this.settingsModalTargetTab = null
    },
    openSettingsModalTab(value, mode = 'user') {
      this.settingsModalTargetTab = value
      this.openSettingsModal(mode)
    },
    removeGlobalNotice(notice) {
      this.globalNotices = this.globalNotices.filter((n) => n !== notice)
    },
    setGlobalError({ error, instance, info }) {
      switch (info) {
        case 'https://vuejs.org/error-reference/#runtime-13': {
          this.globalError = {
            title: 'general.refresh_required',
            content: 'general.refresh_required_content',
            // `true` disables cache on Firefox (non-standard)
            recover: () => window.location.reload(true),
            recoverText: 'general.refresh_required_refresh',
            error,
          }
          break
        }
        default: {
          this.globalError = { error }
          break
        }
      }
    },
    clearGlobalError() {
      this.globalError = null
    },
    pushGlobalNotice({
      messageKey,
      messageArgs = {},
      level = 'error',
      timeout = 5000,
    }) {
      const notice = {
        messageKey,
        messageArgs,
        level,
      }

      this.globalNotices.push(notice)

      // Adding a new element to array wraps it in a Proxy, which breaks the comparison
      // TODO: Generate UUID or something instead or relying on !== operator?
      const newNotice = this.globalNotices[this.globalNotices.length - 1]
      if (timeout > 0) {
        setTimeout(() => this.removeGlobalNotice(newNotice), timeout)
      }

      return newNotice
    },
    setLayoutHeight(value) {
      this.layoutHeight = value
    },
    setLayoutWidth(value) {
      let width = value
      if (value !== undefined) {
        this.layoutWidth = value
      } else {
        width = this.layoutWidth
      }

      const mobileLayout = width <= 800
      const normalOrMobile = mobileLayout ? 'mobile' : 'normal'
      const { thirdColumnMode } = useMergedConfigStore().mergedConfig
      if (thirdColumnMode === 'none' || !useUsersStore().currentUser) {
        this.layoutType = normalOrMobile
      } else {
        const wideLayout = width >= 1300
        this.layoutType = wideLayout ? 'wide' : normalOrMobile
      }
    },
    setPrefersDarkMode(value) {
      if (this.prefersDark !== value) {
        this.prefersDark = value
        this.applyTheme(null, true)
      }
    },
    setFontsList(value) {
      this.localFonts = [...new Set(value.map(({ family }) => family)).values()]
    },
    queryLocalFonts() {
      if (this.localFonts !== null) return
      this.setFontsList([])

      if (!this.browserSupport.localFonts) {
        return
      }
      window
        .queryLocalFonts()
        .then((fonts) => {
          this.setFontsList(fonts)
        })
        .catch((e) => {
          this.pushGlobalNotice({
            messageKey: 'settings.style.themes3.font.font_list_unavailable',
            messageArgs: {
              error: e,
            },
            level: 'error',
          })
        })
    },
    setLastTimeline(value) {
      this.lastTimeline = value
    },
    // Themes stuff
    async setPreference({ path, value, store }) {
      switch (store) {
        case 'sync':
          return useSyncConfigStore().setPreference({
            path: `simple.${path}`,
            value,
          })
        case 'local':
          return useLocalConfigStore().set({ path, value })
        // Copypasta from setting.js
        case 'fe-admin': {
          if (this.adminFrontendConfig === null) {
            this.adminFrontendConfig = cloneDeep(
              useAdminSettingsStore().frontendConfig,
            )
          }
          set(this.adminFrontendConfig, path, value)
        }
      }
    },
    async unsetPreference({ path, value, store }) {
      switch (store) {
        case 'sync':
          return useSyncConfigStore().setPreference({
            path: `simple.${path}`,
            value: undefined,
          })
        case 'local':
          return useLocalConfigStore().unset({ path, value })
        // Copypasta from setting.js
        case 'fe-admin': {
          if (this.adminFrontendConfig === null) {
            this.adminFrontendConfig = cloneDeep(
              useAdminSettingsStore().frontendConfig,
            )
          }
          unset(this.adminFrontendConfig, path)
        }
      }
    },
    async pushPreferences({ store }) {
      if (store === 'sync') {
        return useSyncConfigStore().pushSyncConfig()
      } else if (store === 'fe-admin') {
        const path = [
          ':pleroma',
          ':frontend_configurations',
          ':pleroma_fe',
        ].join('.')
        const value = Object.fromEntries(
          Object.entries(this.adminFrontendConfig).map(([k, v]) => [
            `:${k}`,
            v,
          ]),
        )
        return useAdminSettingsStore()
          .pushAdminSetting({
            path,
            value,
          })
          .then(() => {
            this.adminFrontendConfig = cloneDeep(
              useAdminSettingsStore().frontendConfig,
            )
          })
      } else {
        return
      }
    },
    async fetchPalettesIndex() {
      try {
        const value = await getResourcesIndex('/static/palettes/index.json')
        useInstanceStore().set({
          path: 'palettesIndex',
          value,
        })
        return value
      } catch (e) {
        console.error('Could not fetch palettes index', e)
        useInstanceStore().set({
          path: 'palettesIndex',
          value: { _error: e },
        })
        return {}
      }
    },
    async setPalette(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3Palette(store)
      this.resetThemeV2(store)

      this.setPreference({ path: 'palette', value, store })
      await this.pushPreferences({ store })

      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    async setPaletteCustom(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3Palette(store)
      this.resetThemeV2(store)

      this.setPreference({
        path: 'paletteCustomData',
        value,
        store,
      })
      await this.pushPreferences({ store })

      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    async fetchStylesIndex() {
      try {
        const value = await getResourcesIndex(
          '/static/styles/index.json',
          deserialize,
        )
        useInstanceStore().set({ path: 'stylesIndex', value })
        return value
      } catch (e) {
        console.error('Could not fetch styles index', e)
        useInstanceStore().set({
          path: 'simple.stylesIndex',
          value: { _error: e },
        })
        return {}
      }
    },
    async setStyle(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3(store)
      this.resetThemeV2(store)
      this.resetThemeV3Palette(store)

      this.setPreference({ path: 'themeVersionUse', value: 'v3', store })
      this.setPreference({ path: 'style', value, store })
      await this.pushPreferences({ store })

      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    async setStyleCustom(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3(store)
      this.resetThemeV2(store)
      this.resetThemeV3Palette(store)

      this.setPreference({ path: 'themeVersionUse', value: 'v3', store })
      this.setPreference({
        path: 'styleCustomData',
        value,
        store,
      })
      await this.pushPreferences({ store })

      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    async fetchThemesIndex() {
      try {
        const value = await getResourcesIndex('/static/styles.json')
        useInstanceStore().set({ path: 'themesIndex', value })
        return value
      } catch (e) {
        console.error('Could not fetch themes index', e)
        useInstanceStore().set({
          path: 'themesIndex',
          value: { _error: e },
        })
        return {}
      }
    },
    async setTheme(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3(store)
      this.resetThemeV3Palette(store)
      this.resetThemeV2(store)

      this.setPreference({ path: 'themeVersionUse', value: 'v2', store })
      this.setPreference({ path: 'theme', value, store })
      await this.pushPreferences({ store })

      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    async setThemeCustom(value, store) {
      const { fullIdentifier: themeIdentifierOld } = this.getUsedThemeInfo()
      this.resetThemeV3(store)
      this.resetThemeV3Palette(store)
      this.resetThemeV2(store)

      this.setPreference({ path: 'themeVersionUse', value: 'v2', store })
      this.setPreference({ path: 'customTheme', value, store })
      this.setPreference({
        path: 'customThemeSource',
        value,
      })
      await this.pushPreferences({ store })
      const { fullIdentifier: themeIdentifierNew } = this.getUsedThemeInfo()

      if (themeIdentifierNew !== themeIdentifierOld) {
        this.applyTheme(store, true)
      }
    },
    resetThemeV3(store) {
      this.unsetPreference({ path: 'style', store })
      this.unsetPreference({
        path: 'styleCustomData',
        store,
      })
    },
    resetThemeV3Palette(store) {
      this.unsetPreference({
        path: 'palette',
        store,
      })
      this.unsetPreference({
        path: 'paletteCustomData',
        store,
      })
    },
    resetThemeV2(store) {
      this.unsetPreference({
        path: 'theme',
        store,
      })
      this.unsetPreference({
        path: 'customTheme',
        store,
      })
      this.unsetPreference({
        path: 'customThemeSource',
        store,
      })
    },
    getUsedThemeInfo() {
      let {
        theme: instanceThemeV2Name,
        customTheme: instanceThemeV2Snapshot,
        customThemeSource: instanceThemeV2Source,
        style: instanceStyleName,
        styleCustomData: instanceStyleCustomData,
        palette: instancePaletteName,
        paletteCustomData: instancePaletteCustomData,
        themeVersionUse: instanceThemeVersionUse,
      } = useMergedConfigStore().mergedConfigDefault

      let {
        theme: userThemeV2Name,
        customTheme: userThemeV2Snapshot,
        customThemeSource: userThemeV2Source,
        style: userStyleName,
        styleCustomData: userStyleCustomData,
        palette: userPaletteName,
        paletteCustomData: userPaletteCustomData,
        themeVersionUse: userThemeVersionUse,
      } = useMergedConfigStore().mergedConfigWithoutDefaults

      console.debug(
        `User V3 palette: ${userPaletteName}, style: ${userStyleName}, custom: ${!!userStyleCustomData}`,
      )
      console.debug(
        `User V2 name: ${userThemeV2Name}, source: ${!!userThemeV2Source}, snapshot: ${!!userThemeV2Snapshot}`,
      )

      console.debug(
        `Instance V3 palette: ${instancePaletteName}, style: ${instanceStyleName}, custom: ${!!instanceStyleCustomData}`,
      )
      console.debug(
        `Instance V2 name: ${instanceThemeV2Name}, custom: ${!!instanceThemeV2Snapshot}`,
      )

      const userThemeV2CustomData = userThemeV2Source ?? userThemeV2Snapshot
      const instanceThemeV2CustomData =
        instanceThemeV2Source ?? instanceThemeV2Snapshot

      const userThemeV2Used = Boolean(userThemeV2Name || userThemeV2CustomData)
      const userThemeV3Used = Boolean(userStyleName || userStyleCustomData)
      const userThemeUsed = userThemeV2Used || userThemeV3Used
      userThemeVersionUse = (() => {
        if (userThemeV2Used && userThemeV3Used) {
          return userThemeVersionUse
        } else if (userThemeV2Used) {
          return 'v2'
        } else if (userThemeV3Used) {
          return 'v3'
        } else {
          return undefined
        }
      })()

      const instanceThemeV2Used = Boolean(
        instanceThemeV2Name || instanceThemeV2CustomData,
      )
      const instanceThemeV3Used = Boolean(
        instanceStyleName || instanceStyleCustomData,
      )
      // const instanceThemeUsed = instanceThemeV2Used || instanceThemeV3Used
      instanceThemeVersionUse = (() => {
        if (instanceThemeV2Used && instanceThemeV3Used) {
          return instanceThemeVersionUse
        } else if (instanceThemeV2Used) {
          return 'v2'
        } else if (instanceThemeV3Used) {
          return 'v3'
        } else {
          return undefined
        }
      })()

      const userPaletteUsed = Boolean(userPaletteName || userPaletteCustomData)
      // const instancePaletteUsed = Boolean(
      //   instancePaletteName || instancePaletteCustomData,
      // )

      if (userStyleName === 'stock') userStyleName = undefined
      if (instanceStyleName === 'stock') instanceStyleName = undefined
      if (userPaletteName === 'auto') userPaletteName = undefined
      if (instancePaletteName === 'auto') instancePaletteName = undefined

      const majorVersionUsed =
        (userThemeUsed ? userThemeVersionUse : instanceThemeVersionUse) ?? 'v3'

      const themeName = (() => {
        if (userThemeUsed) {
          return userThemeV2Used ? userThemeV2Name : userStyleName
        } else {
          return instanceThemeV2Used ? instanceThemeV2Name : instanceStyleName
        }
      })()
      const themeCustomData = (() => {
        if (userThemeUsed) {
          return majorVersionUsed === 'v2'
            ? userThemeV2CustomData
            : userStyleCustomData
        } else {
          return majorVersionUsed === 'v2'
            ? instanceThemeV2CustomData
            : instanceStyleCustomData
        }
      })()

      const paletteName = userPaletteUsed
        ? userPaletteName
        : instancePaletteName
      const paletteCustomData = userPaletteUsed
        ? userPaletteCustomData
        : instancePaletteCustomData

      const themeIdentifier = (() => {
        if (themeCustomData) {
          return `<custom: ${sum(themeCustomData)}>`
        } else {
          return themeName
        }
      })()
      const paletteIdentifier = (() => {
        if (majorVersionUsed === 'v2') return 'none'
        if (userPaletteUsed) {
          return `<custom: ${sum(paletteCustomData)}>`
        } else {
          return paletteName
        }
      })()
      const fullIdentifier = `${majorVersionUsed}:${themeIdentifier}:${paletteIdentifier}`

      console.debug(`Final identifier: ${fullIdentifier}`)
      return {
        fullIdentifier,
        majorVersionUsed,
        themeName,
        themeCustomData,
        paletteName,
        paletteCustomData,
      }
    },
    async getThemeData() {
      const getData = async (resource, index, customData, name) => {
        const capitalizedResource =
          resource[0].toUpperCase() + resource.slice(1)
        const result = {}

        if (customData) {
          result.nameUsed = 'custom' // custom data overrides name
          result.dataUsed = customData
        } else {
          result.nameUsed = name

          if (result.nameUsed == null) {
            result.dataUsed = null
            return result
          }

          let fetchFunc = index[result.nameUsed]
          // Fallbacks
          if (!fetchFunc) {
            if (resource === 'style' || resource === 'palette') {
              return result
            }
            const newName = Object.keys(index)[0]
            fetchFunc = index[newName]
            console.warn(
              `${capitalizedResource} with id '${this.styleNameUsed}' not found, trying back to '${newName}'`,
            )
            if (!fetchFunc) {
              console.warn(
                `${capitalizedResource} doesn't have a fallback, defaulting to stock.`,
              )
              fetchFunc = () => Promise.resolve(null)
            }
          }
          result.dataUsed = await fetchFunc()
        }
        return result
      }

      const {
        majorVersionUsed,
        themeName,
        themeCustomData,
        paletteName,
        paletteCustomData,
      } = this.getUsedThemeInfo()

      if (majorVersionUsed === 'v3') {
        await Promise.all([this.fetchPalettesIndex(), this.fetchStylesIndex()])
      } else {
        // Promise.all just to be uniform with v3
        await Promise.all([this.fetchThemesIndex()])
      }

      this.themeVersion = majorVersionUsed

      console.debug('Version used', majorVersionUsed)

      if (majorVersionUsed === 'v3') {
        this.themeDataUsed = null
        this.themeNameUsed = null

        const style = await getData(
          'style',
          useInstanceStore().stylesIndex,
          themeCustomData,
          themeName,
        )
        this.styleNameUsed = style.nameUsed
        this.styleDataUsed = style.dataUsed

        const stylePalettes = Object.fromEntries(
          (style.dataUsed ?? [])
            .filter((x) => x.component === '@palette')
            .map((x) => {
              const cleanDirectives = Object.fromEntries(
                Object.entries(x.directives).filter(([k]) => k),
              )

              return [
                x.variant.replace(/\./g, '_'),
                () => ({ name: x.variant, ...cleanDirectives }),
              ]
            }),
        )

        const allPalettes =
          Object.keys(stylePalettes).length > 0
            ? stylePalettes
            : useInstanceStore().palettesIndex

        const defaultPalette = (() => {
          if (this.prefersDark === null) return null
          const matchRegex = this.prefersDark ? /dark/i : /light/i
          const keys = Object.keys(allPalettes)
          return keys.find((x) => matchRegex.test(x)) ?? keys[0]
        })()

        const palette = await getData(
          'palette',
          allPalettes,
          paletteCustomData,
          paletteName ?? defaultPalette,
        )

        this.paletteNameUsed = palette.nameUsed
        this.paletteDataUsed = palette.dataUsed

        if (this.paletteDataUsed) {
          this.paletteDataUsed.link =
            this.paletteDataUsed.link || this.paletteDataUsed.accent
          this.paletteDataUsed.accent =
            this.paletteDataUsed.accent || this.paletteDataUsed.link
        }
        if (Array.isArray(this.paletteDataUsed)) {
          const [
            name,
            bg,
            fg,
            text,
            link,
            cRed = '#FF0000',
            cGreen = '#00FF00',
            cBlue = '#0000FF',
            cOrange = '#E3FF00',
          ] = palette.dataUsed
          this.paletteDataUsed = {
            name,
            bg,
            fg,
            text,
            link,
            accent: link,
            cRed,
            cBlue,
            cGreen,
            cOrange,
          }
        }
        console.debug('Palette data used', palette.dataUsed)
      } else {
        this.styleNameUsed = null
        this.styleDataUsed = null
        this.paletteNameUsed = null
        this.paletteDataUsed = null

        const theme = await getData(
          'theme',
          useInstanceStore().themesIndex,
          themeCustomData,
          themeName,
        )
        this.themeNameUsed = theme.nameUsed
        this.themeDataUsed = theme.dataUsed
      }
    },
    async setThemeApplied() {
      this.themeApplied = true
    },
    async applyTheme(store, recompile) {
      const { mergedConfig } = useMergedConfigStore()
      const { forceThemeRecompilation, themeDebug } = mergedConfig

      this.themeChangeInProgress = true
      // If we're not forced to recompile try using
      // cache (tryLoadCache return true if load successful)

      const forceRecompile = forceThemeRecompilation || recompile

      await this.getThemeData()

      if (!forceRecompile && !themeDebug && (await tryLoadCache())) {
        this.themeChangeInProgress = false
        return this.setThemeApplied()
      }
      window.splashUpdate('splash.theme')

      try {
        const paletteIss = (() => {
          if (!this.paletteDataUsed) return null
          const result = {
            component: 'Root',
            directives: {},
          }

          Object.entries(this.paletteDataUsed)
            .filter(([k]) => k !== 'name')
            .forEach(([k, v]) => {
              let issRootDirectiveName
              switch (k) {
                case 'background':
                  issRootDirectiveName = 'bg'
                  break
                case 'foreground':
                  issRootDirectiveName = 'fg'
                  break
                default:
                  issRootDirectiveName = k
              }
              result.directives['--' + issRootDirectiveName] = 'color | ' + v
            })
          return result
        })()

        const theme2ruleset =
          this.themeDataUsed &&
          convertTheme2To3(normalizeThemeData(this.themeDataUsed))
        const hacks = []

        const fontMap = {
          Interface: 'Root',
          Input: 'Input',
          Posts: 'Post',
          Monospace: 'Root',
        }

        Object.entries(fontMap).forEach(([font, component]) => {
          const family = mergedConfig[`font${font}`]
          const variable = font === 'Monospace' ? '--monoFont' : '--font'
          if (typeof family === 'string') {
            const familyString = GENERIC_FONT_NAMES.has(family)
              ? family
              : `"${family}"`
            hacks.push({
              component,
              directives: {
                [variable]: `generic | ${familyString}`,
              },
            })
          }
        })

        if (mergedConfig.underlay !== 'none') {
          const newRule = {
            component: 'Underlay',
            directives: {},
          }
          if (mergedConfig.underlay === 'opaque') {
            newRule.directives.opacity = 1
            newRule.directives.background = '--wallpaper'
          }
          if (mergedConfig.underlay === 'transparent') {
            newRule.directives.opacity = 0
          }
          hacks.push(newRule)
        }

        const rulesetArray = [
          theme2ruleset,
          this.styleDataUsed,
          paletteIss,
          hacks,
        ].filter(Boolean)

        return applyTheme(
          rulesetArray.flat(),
          () => this.setThemeApplied(),
          (cache) => {
            this.themeChangeInProgress = false
            if (store) {
              this.setPreference({
                path: 'themeChecksum',
                value: cache.checksum,
                store,
              })
              this.pushPreferences({ store })
            }
          },
          themeDebug,
        )
      } catch (e) {
        console.error(e)
        window.splashError(e)
      }
    },

    // Push notifications
    registerPushNotifications() {
      // hosted: the service worker would ask this site, not the instance,
      // for the pushed notification
      if (useInstanceStore().hosted) return
      const token = useOAuthStore().token
      const vapidPublicKey = useInstanceStore().vapidPublicKey
      const isEnabled = useMergedConfigStore().mergedConfig.webPushNotifications
      const notificationVisibility =
        useMergedConfigStore().mergedConfig.notificationVisibility

      registerPushNotifications(
        isEnabled,
        vapidPublicKey,
        token,
        notificationVisibility,
      )
    },

    unregisterPushNotifications() {
      const token = useOAuthStore().token

      unregisterPushNotifications(token)
    },
  },
})

export const normalizeThemeData = (input) => {
  let themeData, themeSource

  if (input.themeFileVerison === 1) {
    // this might not be even used at all, some leftover of unimplemented code in V2 editor
    return generatePreset(input).theme
  } else if (
    Object.hasOwn(input, '_pleroma_theme_version') ||
    Object.hasOwn(input, 'source') ||
    Object.hasOwn(input, 'theme')
  ) {
    // We got passed a full theme file
    themeData = input.theme
    themeSource = input.source
  } else if (
    Object.hasOwn(input, 'themeEngineVersion') ||
    Object.hasOwn(input, 'colors')
  ) {
    // We got passed a source/snapshot
    themeData = input
    themeSource = input
  }
  // New theme presets don't have 'theme' property, they use 'source'

  let out // shout, shout let it all out
  if (themeSource?.themeEngineVersion === CURRENT_VERSION) {
    // There are some themes in wild that have completely broken source
    out = { ...(themeData || {}), ...themeSource }
  } else {
    out = themeData
  }

  // generatePreset here basically creates/updates "snapshot",
  // while also fixing the 2.2 -> 2.3 colors/shadows/etc
  return generatePreset(out).theme
}
