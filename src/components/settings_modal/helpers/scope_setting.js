import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    ScopeSelector,
  },
}
