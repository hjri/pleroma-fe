import FontControl from 'src/components/font_control/font_control.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  props: {
    ...Setting.props,
    noInherit: Boolean,
  },
  components: {
    ...Setting.components,
    FontControl,
  },
}
