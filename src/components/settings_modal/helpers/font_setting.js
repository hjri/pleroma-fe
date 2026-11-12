import Setting from './setting.js'
import FontControl from 'src/components/font_control/font_control.vue'

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
