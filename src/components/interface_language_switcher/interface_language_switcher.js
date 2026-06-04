import { v4 as uuidv4 } from 'uuid'

import localeService from '../../services/locale/locale.service.js'
import Select from 'src/components/select/select.vue'

export default {
  components: {
    Select,
  },
  props: {
    // List of languages (or just one language)
    modelValue: {
      type: [Array, String],
      required: true,
    },
    // Is this setting stored in user profile (true) or elsewhere (false)
    // Doesn't affect storage, just shows an icon if true
    profile: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    languages() {
      return localeService.languages
    },
    uniqueId() {
      return uuidv4()
    },
    controlledLanguage: {
      get: function () {
        return Array.isArray(this.modelValue)
          ? this.modelValue
          : [this.modelValue]
      },
      set: function (val) {
        this.$emit('update:modelValue', val)
      },
    },
  },

  methods: {
    getLanguageName(code) {
      return localeService.getLanguageName(code)
    },
    addLanguage() {
      this.controlledLanguage = [...this.controlledLanguage, '']
    },
    setLanguageAt(index, val) {
      const lang = [...this.controlledLanguage]
      lang[index] = val
      this.controlledLanguage = lang
    },
    removeLanguageAt(index) {
      const lang = [...this.controlledLanguage]
      lang.splice(index, 1)
      this.controlledLanguage = lang
    },
  },
}
