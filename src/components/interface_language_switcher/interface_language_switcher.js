import localeService from '../../services/locale/locale.service.js'

import Select from '../select/select.vue'
import ProfileSettingIndicator from 'src/components/settings_modal/helpers/profile_setting_indicator.vue'

export default {
  components: {
    Select,
    ProfileSettingIndicator
  },
  props: {
    // List of languages (or just one language)
    modelValue: {
      type: [Array, String],
      required: true
    },
    // Is this setting stored in user profile (true) or elsewhere (false)
    // Doesn't affect storage, just shows an icon if true
    profile: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  computed: {
    languages () {
      return localeService.languages
    },

    controlledLanguage: {
      get: function () {
        return Array.isArray(this.modelValue) ? this.modelValue : [this.modelValue]
      },
      set: function (val) {
        this.$emit('update:modelValue', val)
      }
    }
  },

  methods: {
    getLanguageName (code) {
      return localeService.getLanguageName(code)
    },
    addLanguage () {
      this.controlledLanguage = [...this.controlledLanguage, '']
    },
    setLanguageAt (index, val) {
      const lang = [...this.controlledLanguage]
      lang[index] = val
      this.controlledLanguage = lang
    },
    removeLanguageAt (index) {
      const lang = [...this.controlledLanguage]
      lang.splice(index, 1)
      this.controlledLanguage = lang
    }
  }
}
