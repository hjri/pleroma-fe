import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  computed: {
    ...Setting.computed,
    urlField: {
      get() {
        if (this.visibleState?.tuple) {
          return this.visibleState.tuple[1] + ':' + this.visibleState.tuple[2]
        } else {
          return this.visibleState
        }
      },
      set(e) {
        const string = e.target.value
        if (this.socksField) {
          this.visibleState = { tuple: [':socks5', ...string.split(':')] }
        } else {
          this.visibleState = string
        }
      },
    },
    socksField: {
      get() {
        return this.visibleState?.tuple
      },
      set(e) {
        if (e) {
          this.visibleState = {
            tuple: [':socks5', ...this.urlField.split(':')],
          }
        } else {
          this.visibleState = this.urlField
        }
      },
    },
  },
  components: {
    ...Setting.components,
    Checkbox,
  },
}
