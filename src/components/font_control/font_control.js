import Checkbox from 'src/components/checkbox/checkbox.vue'
import Popover from 'src/components/popover/popover.vue'
import Select from '../select/select.vue'
import LocalSettingIndicator from 'src/components/settings_modal/helpers/local_setting_indicator.vue'

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
    Checkbox,
    Popover,
    LocalSettingIndicator,
  },
  props: ['name', 'label', 'modelValue', 'fallback', 'options', 'no-inherit', 'isLocal'],
  mounted() {
    useInterfaceStore().queryLocalFonts()
  },
  emits: ['update:modelValue'],
  data() {
    return {
      manualEntry: false,
      availableOptions: [
        this.noInherit ? '' : 'inherit',
        'serif',
        'sans-serif',
        'monospace',
        ...(this.options || []),
      ].filter((_) => _),
    }
  },
  methods: {
    toggleManualEntry() {
      this.manualEntry = !this.manualEntry
    },
  },
  computed: {
    present() {
      return typeof this.modelValue !== 'undefined'
    },
    localFontsList() {
      return useInterfaceStore().localFonts
    },
    localFontsSize() {
      return useInterfaceStore().localFonts?.length
    },
  },
}
