import Select from 'src/components/select/select.vue'

import { useInterfaceStore } from 'src/stores/interface.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faExclamationTriangle,
  faFont,
  faKeyboard,
} from '@fortawesome/free-solid-svg-icons'

library.add(faExclamationTriangle, faKeyboard, faFont)

export default {
  components: {
    Select,
  },
  props: {
    id: String,
    modelValue: String,
    fallback: String,
    options: Object,
    noInherit: Boolean,
  },
  emits: ['update:modelValue'],
  mounted() {
    useInterfaceStore().queryLocalFonts()
  },
  data() {
    return {
      manualEntry: false,
      availableOptions: [
        this.noInherit ? '' : 'inherit',
        'serif',
        'sans-serif',
        'monospace',
        ...(this.options || []),
      ].filter(Boolean),
    }
  },
  methods: {
    toggleManualEntry() {
      this.manualEntry = !this.manualEntry
    },
  },
  computed: {
    present() {
      return this.modelValue != null
    },
    localFontsList() {
      return useInterfaceStore().localFonts
    },
    localFontsSize() {
      return useInterfaceStore().localFonts?.length
    },
  },
}
