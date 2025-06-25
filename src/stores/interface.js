import { defineStore } from 'pinia'

import { CURRENT_VERSION, generatePreset } from 'src/services/theme_data/theme_data.service.js'
import { getResourcesIndex, applyTheme, tryLoadCache } from '../services/style_setter/style_setter.js'
import { convertTheme2To3 } from 'src/services/theme_data/theme2_to_theme3.js'
import { deserialize } from '../services/theme_data/iss_deserializer.js'

export const useInterfaceStore = defineStore('interface', {
  state: () => ({
    localFonts: null,
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
    temporaryChangesTimeoutId: null, // used for temporary options that revert after a timeout
    temporaryChangesConfirm: () => {}, // used for applying temporary options
    temporaryChangesRevert: () => {}, // used for reverting temporary options
    settingsModalState: 'hidden',
    settingsModalLoadedUser: false,
    settingsModalLoadedAdmin: false,
    settingsModalTargetTab: null,
    settingsModalMode: 'user',
    settings: {
      currentSaveStateNotice: null,
      noticeClearTimeout: null,
      notificationPermission: null
    },
    browserSupport: {
      cssFilter: window.CSS && window.CSS.supports && (
        window.CSS.supports('filter', 'drop-shadow(0 0)') ||
        window.CSS.supports('-webkit-filter', 'drop-shadow(0 0)')
      ),
      localFonts: typeof window.queryLocalFonts === 'function'
    },
    layoutType: 'normal',
    globalNotices: [],
    layoutHeight: 0,
    lastTimeline: null
  }),
  actions: {
    setTemporaryChanges ({ timeoutId, confirm, revert }) {
      this.temporaryChangesTimeoutId = timeoutId
      this.temporaryChangesConfirm = confirm
      this.temporaryChangesRevert = revert
    },
    clearTemporaryChanges () {
      clearTimeout(this.temporaryChangesTimeoutId)
      this.temporaryChangesTimeoutId = null
      this.temporaryChangesConfirm = () => {}
      this.temporaryChangesRevert = () => {}
    },
    setPageTitle (option = '') {
      try {
        document.title = `${option} ${window.vuex.state.instance.name}`
      } catch (error) {
        console.error(`${error}`)
      }
    },
    settingsSaved ({ success, error }) {
      if (success) {
        if (this.noticeClearTimeout) {
          clearTimeout(this.noticeClearTimeout)
        }
        this.settings.currentSaveStateNotice = { error: false, data: success }
        this.settings.noticeClearTimeout = setTimeout(() => delete this.settings.currentSaveStateNotice, 2000)
      } else {
        this.settings.currentSaveStateNotice = { error: true, errorData: error }
      }
    },
    setNotificationPermission (permission) {
      this.notificationPermission = permission
    },
    closeSettingsModal () {
      this.settingsModalState = 'hidden'
    },
    openSettingsModal (value) {
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
    togglePeekSettingsModal () {
      switch (this.settingsModalState) {
        case 'minimized':
          this.settingsModalState = 'visible'
          return
        case 'visible':
          this.settingsModalState = 'minimized'
          return
        default:
          throw new Error('Illegal minimization state of settings modal')
      }
    },
    clearSettingsModalTargetTab () {
      this.settingsModalTargetTab = null
    },
    openSettingsModalTab (value, mode = 'user') {
      this.settingsModalTargetTab = value
      this.openSettingsModal(mode)
    },
    removeGlobalNotice (notice) {
      this.globalNotices = this.globalNotices.filter(n => n !== notice)
    },
    pushGlobalNotice (
      {
        messageKey,
        messageArgs = {},
        level = 'error',
        timeout = 0
      }) {
      const notice = {
        messageKey,
        messageArgs,
        level
      }

      this.globalNotices.push(notice)

      // Adding a new element to array wraps it in a Proxy, which breaks the comparison
      // TODO: Generate UUID or something instead or relying on !== operator?
      const newNotice = this.globalNotices[this.globalNotices.length - 1]
      if (timeout) {
        setTimeout(() => this.removeGlobalNotice(newNotice), timeout)
      }

      return newNotice
    },
    setLayoutHeight (value) {
      this.layoutHeight = value
    },
    setLayoutWidth (value) {
      let width = value
      if (value !== undefined) {
        this.layoutWidth = value
      } else {
        width = this.layoutWidth
      }

      const mobileLayout = width <= 800
      const normalOrMobile = mobileLayout ? 'mobile' : 'normal'
      const { thirdColumnMode } = window.vuex.getters.mergedConfig
      if (thirdColumnMode === 'none' || !window.vuex.state.users.currentUser) {
        this.layoutType = normalOrMobile
      } else {
        const wideLayout = width >= 1300
        this.layoutType = wideLayout ? 'wide' : normalOrMobile
      }
    },
    setFontsList (value) {
      this.localFonts = [...(new Set(value.map(font => font.family))).values()]
    },
    queryLocalFonts () {
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
              error: e
            },
            level: 'error'
          })
        })
    },
    setLastTimeline (value) {
      this.lastTimeline = value
    },
    async fetchPalettesIndex () {
      try {
        const value = await getResourcesIndex('/static/palettes/index.json')
        window.vuex.commit('setInstanceOption', { name: 'palettesIndex', value })
        return value
      } catch (e) {
        console.error('Could not fetch palettes index', e)
        window.vuex.commit('setInstanceOption', { name: 'palettesIndex', value: { _error: e } })
        return Promise.resolve({})
      }
    },
    setPalette (value) {
      this.resetThemeV3Palette()
      this.resetThemeV2()

      window.vuex.commit('setOption', { name: 'palette', value })

      this.applyTheme({ recompile: true })
    },
    setPaletteCustom (value) {
      this.resetThemeV3Palette()
      this.resetThemeV2()

      window.vuex.commit('setOption', { name: 'paletteCustomData', value })

      this.applyTheme({ recompile: true })
    },
    async fetchStylesIndex () {
      try {
        const value = await getResourcesIndex(
          '/static/styles/index.json',
          deserialize
        )
        window.vuex.commit('setInstanceOption', { name: 'stylesIndex', value })
        return value
      } catch (e) {
        console.error('Could not fetch styles index', e)
        window.vuex.commit('setInstanceOption', { name: 'stylesIndex', value: { _error: e } })
        return Promise.resolve({})
      }
    },
    setStyle (value) {
      this.resetThemeV3()
      this.resetThemeV2()
      this.resetThemeV3Palette()

      window.vuex.commit('setOption', { name: 'style', value })
      this.useStylePalette = true

      this.applyTheme({ recompile: true }).then(() => {
        this.useStylePalette = false
      })
    },
    setStyleCustom (value) {
      this.resetThemeV3()
      this.resetThemeV2()
      this.resetThemeV3Palette()

      window.vuex.commit('setOption', { name: 'styleCustomData', value })

      this.useStylePalette = true
      this.applyTheme({ recompile: true }).then(() => {
        this.useStylePalette = false
      })
    },
    async fetchThemesIndex () {
      try {
        const value = await getResourcesIndex('/static/styles.json')
        window.vuex.commit('setInstanceOption', { name: 'themesIndex', value })
        return value
      } catch (e) {
        console.error('Could not fetch themes index', e)
        window.vuex.commit('setInstanceOption', { name: 'themesIndex', value: { _error: e } })
        return Promise.resolve({})
      }
    },
    setTheme (value) {
      this.resetThemeV3()
      this.resetThemeV3Palette()
      this.resetThemeV2()

      window.vuex.commit('setOption', { name: 'theme', value })

      this.applyTheme({ recompile: true })
    },
    setThemeCustom (value) {
      this.resetThemeV3()
      this.resetThemeV3Palette()
      this.resetThemeV2()

      window.vuex.commit('setOption', { name: 'customTheme', value })
      window.vuex.commit('setOption', { name: 'customThemeSource', value })

      this.applyTheme({ recompile: true })
    },
    resetThemeV3 () {
      window.vuex.commit('setOption', { name: 'style', value: null })
      window.vuex.commit('setOption', { name: 'styleCustomData', value: null })
    },
    resetThemeV3Palette () {
      window.vuex.commit('setOption', { name: 'palette', value: null })
      window.vuex.commit('setOption', { name: 'paletteCustomData', value: null })
    },
    resetThemeV2 () {
      window.vuex.commit('setOption', { name: 'theme', value: null })
      window.vuex.commit('setOption', { name: 'customTheme', value: null })
      window.vuex.commit('setOption', { name: 'customThemeSource', value: null })
    },
    async getThemeData () {
      const getData = async (resource, index, customData, name) => {
        const capitalizedResource = resource[0].toUpperCase() + resource.slice(1)
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
            console.warn(`${capitalizedResource} with id '${this.styleNameUsed}' not found, trying back to '${newName}'`)
            if (!fetchFunc) {
              console.warn(`${capitalizedResource} doesn't have a fallback, defaulting to stock.`)
              fetchFunc = () => Promise.resolve(null)
            }
          }
          result.dataUsed = await fetchFunc()
        }
        return result
      }

      const {
        style: instanceStyleName,
        palette: instancePaletteName
      } = window.vuex.state.instance

      let {
        theme: instanceThemeV2Name,
        themesIndex,
        stylesIndex,
        palettesIndex
      } = window.vuex.state.instance

      const {
        style: userStyleName,
        styleCustomData: userStyleCustomData,
        palette: userPaletteName,
        paletteCustomData: userPaletteCustomData
      } = window.vuex.state.config

      let {
        theme: userThemeV2Name,
        customTheme: userThemeV2Snapshot,
        customThemeSource: userThemeV2Source
      } = window.vuex.state.config

      let majorVersionUsed

      console.debug(
        `User V3 palette: ${userPaletteName}, style: ${userStyleName} , custom: ${!!userStyleCustomData}`
      )
      console.debug(
        `User V2 name: ${userThemeV2Name}, source: ${!!userThemeV2Source}, snapshot: ${!!userThemeV2Snapshot}`
      )

      console.debug(`Instance V3 palette: ${instancePaletteName}, style: ${instanceStyleName}`)
      console.debug('Instance V2 theme: ' + instanceThemeV2Name)

      if (userPaletteName || userPaletteCustomData ||
          userStyleName || userStyleCustomData ||
          (
            // User V2 overrides instance V3
            (instancePaletteName ||
             instanceStyleName) &&
              instanceThemeV2Name == null &&
              userThemeV2Name == null
          )
      ) {
        // Palette and/or style overrides V2 themes
        instanceThemeV2Name = null
        userThemeV2Name = null
        userThemeV2Source = null
        userThemeV2Snapshot = null

        majorVersionUsed = 'v3'
      } else if (
        (userThemeV2Name ||
          userThemeV2Snapshot ||
          userThemeV2Source ||
         instanceThemeV2Name)
      ) {
        majorVersionUsed = 'v2'
      } else {
        // if all fails fallback to v3
        majorVersionUsed = 'v3'
      }

      if (majorVersionUsed === 'v3') {
        const result = await Promise.all([
          this.fetchPalettesIndex(),
          this.fetchStylesIndex()
        ])

        palettesIndex = result[0]
        stylesIndex = result[1]
      } else {
        // Promise.all just to be uniform with v3
        const result = await Promise.all([
          this.fetchThemesIndex()
        ])

        themesIndex = result[0]
      }

      this.themeVersion = majorVersionUsed

      console.debug('Version used', majorVersionUsed)

      if (majorVersionUsed === 'v3') {
        this.themeDataUsed = null
        this.themeNameUsed = null

        const style = await getData(
          'style',
          stylesIndex,
          userStyleCustomData,
          userStyleName || instanceStyleName
        )
        this.styleNameUsed = style.nameUsed
        this.styleDataUsed = style.dataUsed

        let firstStylePaletteName = null
        style
          .dataUsed
          ?.filter(x => x.component === '@palette')
          .map(x => {
            const cleanDirectives = Object.fromEntries(
              Object
                .entries(x.directives)
                .filter(([k]) => k)
            )

            return { name: x.variant, ...cleanDirectives }
          })
          .forEach(palette => {
            const key = 'style.' + palette.name.toLowerCase().replace(/ /g, '_')
            if (!firstStylePaletteName) firstStylePaletteName = key
            palettesIndex[key] = () => Promise.resolve(palette)
          })

        const palette = await getData(
          'palette',
          palettesIndex,
          userPaletteCustomData,
          this.useStylePalette ? firstStylePaletteName : (userPaletteName || instancePaletteName)
        )

        if (this.useStylePalette) {
          window.vuex.commit('setOption', { name: 'palette', value: firstStylePaletteName })
        }

        this.paletteNameUsed = palette.nameUsed
        this.paletteDataUsed = palette.dataUsed

        if (this.paletteDataUsed) {
          this.paletteDataUsed.link = this.paletteDataUsed.link || this.paletteDataUsed.accent
          this.paletteDataUsed.accent = this.paletteDataUsed.accent || this.paletteDataUsed.link
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
            cOrange = '#E3FF00'
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
            cOrange
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
          themesIndex,
          userThemeV2Source || userThemeV2Snapshot,
          userThemeV2Name || instanceThemeV2Name
        )
        this.themeNameUsed = theme.nameUsed
        this.themeDataUsed = theme.dataUsed
      }
    },
    async setThemeApplied () {
      this.themeApplied = true
    },
    async applyTheme (
      { recompile = false } = {}
    ) {
      const {
        forceThemeRecompilation,
        themeDebug,
        theme3hacks
      } = window.vuex.state.config
      this.themeChangeInProgress = true
      // If we're not forced to recompile try using
      // cache (tryLoadCache return true if load successful)

      const forceRecompile = forceThemeRecompilation || recompile

      await this.getThemeData()

      if (!forceRecompile && !themeDebug && await tryLoadCache()) {
        this.themeChangeInProgress = false
        return this.setThemeApplied()
      }
      window.splashUpdate('splash.theme')

      try {
        const paletteIss = (() => {
          if (!this.paletteDataUsed) return null
          const result = {
            component: 'Root',
            directives: {}
          }

          Object
            .entries(this.paletteDataUsed)
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

        const theme2ruleset = this.themeDataUsed && convertTheme2To3(normalizeThemeData(this.themeDataUsed))
        const hacks = []

        Object.entries(theme3hacks).forEach(([key, value]) => {
          switch (key) {
            case 'fonts': {
              Object.entries(theme3hacks.fonts).forEach(([fontKey, font]) => {
                if (!font?.family) return
                switch (fontKey) {
                  case 'interface':
                    hacks.push({
                      component: 'Root',
                      directives: {
                        '--font': 'generic | ' + font.family
                      }
                    })
                    break
                  case 'input':
                    hacks.push({
                      component: 'Input',
                      directives: {
                        '--font': 'generic | ' + font.family
                      }
                    })
                    break
                  case 'post':
                    hacks.push({
                      component: 'RichContent',
                      directives: {
                        '--font': 'generic | ' + font.family
                      }
                    })
                    break
                  case 'monospace':
                    hacks.push({
                      component: 'Root',
                      directives: {
                        '--monoFont': 'generic | ' + font.family
                      }
                    })
                    break
                }
              })
              break
            }
            case 'underlay': {
              if (value !== 'none') {
                const newRule = {
                  component: 'Underlay',
                  directives: {}
                }
                if (value === 'opaque') {
                  newRule.directives.opacity = 1
                  newRule.directives.background = '--wallpaper'
                }
                if (value === 'transparent') {
                  newRule.directives.opacity = 0
                }
                hacks.push(newRule)
              }
              break
            }
          }
        })

        const rulesetArray = [
          theme2ruleset,
          this.styleDataUsed,
          paletteIss,
          hacks
        ].filter(x => x)

        return applyTheme(
          rulesetArray.flat(),
          () => this.setThemeApplied(),
          () => {
            this.themeChangeInProgress = false
          },
          themeDebug
        )
      } catch (e) {
        window.splashError(e)
      }
    }
  }
})

export const normalizeThemeData = (input) => {
  let themeData, themeSource

  if (input.themeFileVerison === 1) {
    // this might not be even used at all, some leftover of unimplemented code in V2 editor
    return generatePreset(input).theme
  } else if (
    Object.prototype.hasOwnProperty.call(input, '_pleroma_theme_version') ||
      Object.prototype.hasOwnProperty.call(input, 'source') ||
      Object.prototype.hasOwnProperty.call(input, 'theme')
  ) {
    // We got passed a full theme file
    themeData = input.theme
    themeSource = input.source
  } else if (
    Object.prototype.hasOwnProperty.call(input, 'themeEngineVersion') ||
      Object.prototype.hasOwnProperty.call(input, 'colors')
  ) {
    // We got passed a source/snapshot
    themeData = input
    themeSource = input
  }
  // New theme presets don't have 'theme' property, they use 'source'

  let out // shout, shout let it all out
  if (themeSource && themeSource.themeEngineVersion === CURRENT_VERSION) {
    // There are some themes in wild that have completely broken source
    out = { ...(themeData || {}), ...themeSource }
  } else {
    out = themeData
  }

  // generatePreset here basically creates/updates "snapshot",
  // while also fixing the 2.2 -> 2.3 colors/shadows/etc
  return generatePreset(out).theme
}
