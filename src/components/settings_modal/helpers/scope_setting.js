import Setting from './setting.js'
import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    ScopeSelector,
  },
}
