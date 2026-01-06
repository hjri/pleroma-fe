import ColorInput from 'src/components/color_input/color_input.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    ColorInput,
  },
  methods: {
    ...Setting.methods,
    getValue(e) {
      return e
    },
  },
}
