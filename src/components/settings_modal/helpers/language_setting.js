import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    InterfaceLanguageSwitcher,
  },
}
