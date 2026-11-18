import { useId } from 'vue'

import Select from 'src/components/select/select.vue'
import localeService from '../../services/locale/locale.service.js'

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
    // Whether to support multiple languages or just one
    single: Boolean,
    id: String,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  setup() {
    const uniqueId = useId()

    return {
      uniqueId,
    }
  },
  computed: {
    languages() {
      return localeService.languages
    },
    controlledLanguage: {
      get: function () {
        return Array.isArray(this.modelValue)
          ? this.modelValue
          : [this.modelValue]
      },
      set: function (val) {
        if (this.single) {
          this.$emit('update:modelValue', val[0])
        } else {
          this.$emit('update:modelValue', val)
        }
      },
    },
  },

  methods: {
    getLanguageName(code) {
      return localeService.getLanguageName(code)
    },
    addLanguage() {
      if (this.single) return
      this.controlledLanguage = [...this.controlledLanguage, '']
    },
    setLanguageAt(index, val) {
      const lang = [...this.controlledLanguage]
      lang[index] = val
      this.controlledLanguage = lang
    },
    removeLanguageAt(index) {
      if (this.single) return
      const lang = [...this.controlledLanguage]
      lang.splice(index, 1)
      this.controlledLanguage = lang
    },
  },
}
