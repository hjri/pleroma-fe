import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

import BooleanSetting from '../helpers/boolean_setting.vue'
import ChoiceSetting from '../helpers/choice_setting.vue'
import IntegerSetting from '../helpers/integer_setting.vue'
import FloatSetting from '../helpers/float_setting.vue'
import UnitSetting from '../helpers/unit_setting.vue'
import { defaultHorizontalUnits } from '../helpers/unit_setting.js'
import PaletteEditor from 'src/components/palette_editor/palette_editor.vue'
import Preview from './theme_tab/theme_preview.vue'
import FontControl from 'src/components/font_control/font_control.vue'

import { newImporter } from 'src/services/export_import/export_import.js'
import { convertTheme2To3 } from 'src/services/theme_data/theme2_to_theme3.js'
import { init } from 'src/services/theme_data/theme_data_3.service.js'
import {
  getCssRules
} from 'src/services/theme_data/css_utils.js'
import { deserialize } from 'src/services/theme_data/iss_deserializer.js'
import { createStyleSheet, adoptStyleSheets } from 'src/services/style_setter/style_setter.js'
import fileSizeFormatService from 'src/components/../services/file_size_format/file_size_format.js'

import SharedComputedObject from '../helpers/shared_computed_object.js'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'

import { mapActions } from 'pinia'
import { useInterfaceStore, normalizeThemeData } from 'src/stores/interface'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faGlobe,
  faDashboard,
  faPaintRoller,
  faTableColumns
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faGlobe,
  faPaintRoller,
  faDashboard,
  faTableColumns
)

const AppearanceTab = {
  data () {
    return {
      availableThemesV3: [],
      availableThemesV2: [],
      bundledPalettes: [],
      compilationCache: {},
      fileImporter: newImporter({
        accept: '.json, .iss',
        validator: this.importValidator,
        onImport: this.onImport,
        parser: this.importParser,
        onImportFailure: this.onImportFailure
      }),
      palettesKeys: [
        'bg',
        'fg',
        'link',
        'text',
        'cRed',
        'cGreen',
        'cBlue',
        'cOrange'
      ],
      userPalette: {},
      intersectionObserver: null,
      thirdColumnModeOptions: ['none', 'notifications', 'postform'].map(mode => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.third_column_mode_${mode}`)
      })),
      forcedRoundnessOptions: ['disabled', 'sharp', 'nonsharp', 'round'].map((mode, i) => ({
        key: mode,
        value: i - 1,
        label: this.$t(`settings.style.themes3.hacks.forced_roundness_mode_${mode}`)
      })),
      underlayOverrideModes: ['none', 'opaque', 'transparent'].map((mode) => ({
        key: mode,
        value: mode,
        label: this.$t(`settings.style.themes3.hacks.underlay_override_mode_${mode}`)
      })),
      backgroundUploading: false,
      background: null,
      backgroundPreview: null,
    }
  },
  components: {
    BooleanSetting,
    ChoiceSetting,
    IntegerSetting,
    FloatSetting,
    UnitSetting,
    ProfileSettingIndicator,
    FontControl,
    Preview,
    PaletteEditor,
    TabSwitcher
  },
  mounted () {
    useInterfaceStore().getThemeData()

    const updateIndex = (resource) => {
      const capitalizedResource = resource[0].toUpperCase() + resource.slice(1)
      const currentIndex = this.$store.state.instance[`${resource}sIndex`]

      let promise
      if (currentIndex) {
        promise = Promise.resolve(currentIndex)
      } else {
        promise = useInterfaceStore()[`fetch${capitalizedResource}sIndex`]()
      }

      return promise.then(index => {
        return Object
          .entries(index)
          .map(([k, func]) => [k, func()])
      })
    }

    updateIndex('style').then(styles => {
      styles.forEach(([key, stylePromise]) => stylePromise.then(data => {
        const meta = data.find(x => x.component === '@meta')
        this.availableThemesV3.push({ key, data, name: meta.directives.name, version: 'v3' })
      }))
    })

    updateIndex('theme').then(themes => {
      themes.forEach(([key, themePromise]) => themePromise.then(data => {
        if (!data) {
          console.warn(`Theme with key ${key} is empty or malformed`)
        } else if (Array.isArray(data)) {
          console.warn(`Theme with key ${key} is a v1 theme and should be moved to static/palettes/index.json`)
        } else if (!data.source && !data.theme) {
          console.warn(`Theme with key ${key} is malformed`)
        } else {
          this.availableThemesV2.push({ key, data, name: data.name, version: 'v2' })
        }
      }))
    })

    this.userPalette = useInterfaceStore().paletteDataUsed || {}

    updateIndex('palette').then(bundledPalettes => {
      bundledPalettes.forEach(([key, palettePromise]) => palettePromise.then(v => {
        let palette
        if (Array.isArray(v)) {
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
          ] = v
          palette = { key, name, bg, fg, text, link, cRed, cBlue, cGreen, cOrange }
        } else {
          palette = { key, ...v }
        }
        if (!palette.key.startsWith('style.')) {
          this.bundledPalettes.push(palette)
        }
      }))
    })

    this.previewTheme('stock', 'v3')

    if (window.IntersectionObserver) {
      this.intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return
          const theme = this.availableStyles.find(x => x.key === target.dataset.themeKey)
          this.$nextTick(() => {
            if (theme) this.previewTheme(theme.key, theme.version, theme.data)
          })
          observer.unobserve(target)
        })
      }, {
        root: this.$refs.themeList
      })
    } else {
      this.availableStyles.forEach(theme => this.previewTheme(theme.key, theme.version, theme.data))
    }
  },
  updated () {
    this.$nextTick(() => {
      this.$refs.themeList.querySelectorAll('.theme-preview').forEach(node => {
        this.intersectionObserver.observe(node)
      })
    })
  },
  watch: {
    paletteDataUsed () {
      this.userPalette = this.paletteDataUsed || {}
    }
  },
  computed: {
    isDefaultBackground () {
      return !(this.$store.state.users.currentUser.background_image)
    },
    switchInProgress () {
      return useInterfaceStore().themeChangeInProgress
    },
    paletteDataUsed () {
      return useInterfaceStore().paletteDataUsed
    },
    instanceSpecificPanelPresent () { return this.$store.state.instance.showInstanceSpecificPanel },
    instanceShoutboxPresent () { return this.$store.state.instance.shoutAvailable },
    availableStyles () {
      return [
        ...this.availableThemesV3,
        ...this.availableThemesV2
      ]
    },
    availablePalettes () {
      return [
        ...this.bundledPalettes,
        ...this.stylePalettes
      ]
    },
    stylePalettes () {
      const ruleset = useInterfaceStore().styleDataUsed || []
      if (!ruleset && ruleset.length === 0) return
      const meta = ruleset.find(x => x.component === '@meta')
      const result = ruleset.filter(x => x.component.startsWith('@palette'))
        .map(x => {
          const { variant, directives } = x
          const {
            bg,
            fg,
            text,
            link,
            accent,
            cRed,
            cBlue,
            cGreen,
            cOrange,
            wallpaper
          } = directives

          const result = {
            name: `${meta.directives.name || this.$t('settings.style.themes3.palette.imported')}: ${variant}`,
            key: `style.${variant.toLowerCase().replace(/ /g, '_')}`,
            bg,
            fg,
            text,
            link,
            accent,
            cRed,
            cBlue,
            cGreen,
            cOrange,
            wallpaper
          }
          return Object.fromEntries(Object.entries(result).filter(([, v]) => v))
        })
      return result
    },
    noIntersectionObserver () {
      return !window.IntersectionObserver
    },
    horizontalUnits () {
      return defaultHorizontalUnits
    },
    fontsOverride () {
      return this.$store.getters.mergedConfig.fontsOverride
    },
    columns () {
      const mode = this.$store.getters.mergedConfig.thirdColumnMode

      const notif = mode === 'none' ? [] : ['notifs']

      if (this.$store.getters.mergedConfig.sidebarRight || mode === 'postform') {
        return [...notif, 'content', 'sidebar']
      } else {
        return ['sidebar', 'content', ...notif]
      }
    },
    instanceWallpaperUsed () {
      return this.$store.state.instance.background &&
        !this.$store.state.users.currentUser.background_image
    },
    language: {
      get: function () { return this.$store.getters.mergedConfig.interfaceLanguage },
      set: function (val) {
        this.$store.dispatch('setOption', { name: 'interfaceLanguage', value: val })
      }
    },
    customThemeVersion () {
      const { themeVersion } = useInterfaceStore()
      return themeVersion
    },
    isCustomThemeUsed () {
      const { customTheme, customThemeSource } = this.mergedConfig
      return customTheme != null || customThemeSource != null
    },
    isCustomStyleUsed () {
      const { styleCustomData } = this.mergedConfig
      return styleCustomData != null
    },
    ...SharedComputedObject()
  },
  methods: {
    updateFont (key, value) {
      this.$store.dispatch('setOption', {
        name: 'theme3hacks',
        value: {
          ...this.mergedConfig.theme3hacks,
          fonts: {
            ...this.mergedConfig.theme3hacks.fonts,
            [key]: value
          }
        }
      })
    },
    importFile () {
      this.fileImporter.importData()
    },
    importParser (file, filename) {
      if (filename.endsWith('.json')) {
        return JSON.parse(file)
      } else if (filename.endsWith('.iss')) {
        return deserialize(file)
      }
    },
    onImport (parsed, filename) {
      if (filename.endsWith('.json')) {
        useInterfaceStore().setThemeCustom(parsed.source || parsed.theme)
      } else if (filename.endsWith('.iss')) {
        useInterfaceStore().setStyleCustom(parsed)
      }
    },
    onImportFailure (result) {
      console.error('Failure importing theme:', result)
      useInterfaceStore().pushGlobalNotice({ messageKey: 'settings.invalid_theme_imported', level: 'error' })
    },
    importValidator (parsed, filename) {
      if (filename.endsWith('.json')) {
        const version = parsed._pleroma_theme_version
        return version >= 1 || version <= 2
      } else if (filename.endsWith('.iss')) {
        if (!Array.isArray(parsed)) return false
        if (parsed.length < 1) return false
        if (parsed.find(x => x.component === '@meta') == null) return false
        return true
      }
    },
    isThemeActive (key) {
      return key === (this.mergedConfig.theme || this.$store.state.instance.theme)
    },
    isStyleActive (key) {
      return key === (this.mergedConfig.style || this.$store.state.instance.style)
    },
    isPaletteActive (key) {
      return key === (this.mergedConfig.palette || this.$store.state.instance.palette)
    },
    ...mapActions(useInterfaceStore, [
      'setStyle',
      'setTheme'
    ]),
    setPalette (name, data) {
      useInterfaceStore().setPalette(name)
      this.userPalette = data
    },
    setPaletteCustom (data) {
      useInterfaceStore().setPaletteCustom(data)
      this.userPalette = data
    },
    resetTheming () {
      useInterfaceStore().setStyle('stock')
    },
    previewTheme (key, version, input) {
      let theme3
      if (this.compilationCache[key]) {
        theme3 = this.compilationCache[key]
      } else if (input) {
        if (version === 'v2') {
          const style = normalizeThemeData(input)
          const theme2 = convertTheme2To3(style)
          theme3 = init({
            inputRuleset: theme2,
            ultimateBackgroundColor: '#000000',
            liteMode: true,
            debug: true,
            onlyNormalState: true
          })
        } else if (version === 'v3') {
          const palette = input.find(x => x.component === '@palette')
          let paletteRule
          if (palette) {
            const { directives } = palette
            directives.link = directives.link || directives.accent
            directives.accent = directives.accent || directives.link
            paletteRule = {
              component: 'Root',
              directives: Object.fromEntries(
                Object
                  .entries(directives)
                  .filter(([k]) => k && k !== 'name')
                  .map(([k, v]) => ['--' + k, 'color | ' + v])
              )
            }
          } else {
            paletteRule = null
          }

          theme3 = init({
            inputRuleset: [...input, paletteRule].filter(x => x),
            ultimateBackgroundColor: '#000000',
            liteMode: true,
            onlyNormalState: true
          })
        }
      } else {
        theme3 = init({
          inputRuleset: [],
          ultimateBackgroundColor: '#000000',
          liteMode: true,
          onlyNormalState: true
        })
      }

      if (!this.compilationCache[key]) {
        this.compilationCache[key] = theme3
      }


      const sheet = createStyleSheet('appearance-tab-previews', 90)
      sheet.addRule([
        '#theme-preview-', key, ' {\n',
        getCssRules(theme3.eager).join('\n'),
        '\n}'
      ].join(''))
      sheet.ready = true
      adoptStyleSheets()
    },
    uploadFile (slot, e) {
      const file = e.target.files[0]
      if (!file) { return }
      if (file.size > this.$store.state.instance[slot + 'limit']) {
        const filesize = fileSizeFormatService.fileSizeFormat(file.size)
        const allowedsize = fileSizeFormatService.fileSizeFormat(this.$store.state.instance[slot + 'limit'])
        useInterfaceStore().pushGlobalNotice({
          messageKey: 'upload.error.message',
          messageArgs: [
            this.$t('upload.error.file_too_big', {
              filesize: filesize.num,
              filesizeunit: filesize.unit,
              allowedsize: allowedsize.num,
              allowedsizeunit: allowedsize.unit
            })
          ],
          level: 'error'
        })
        return
      }

      const reader = new FileReader()
      reader.onload = ({ target }) => {
        const img = target.result
        this[slot + 'Preview'] = img
        this[slot] = file
      }
      reader.readAsDataURL(file)
    },
    resetBackground () {
      const confirmed = window.confirm(this.$t('settings.reset_background_confirm'))
      if (confirmed) {
        this.submitBackground('')
      }
    },
    submitBackground (background) {
      if (!this.backgroundPreview && background !== '') { return }

      this.backgroundUploading = true
      this.$store.state.api.backendInteractor.updateProfileImages({ background })
        .then((data) => {
          this.$store.commit('addNewUsers', [data])
          this.$store.commit('setCurrentUser', data)
          this.backgroundPreview = null
        })
        .catch(this.displayUploadError)
        .finally(() => { this.backgroundUploading = false })
    },
  }
}

export default AppearanceTab
