import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

const getUrl = state => state?.tuple ? state.tuple[1] + ':' + state.tuple[2] : state
const getSocks = state => state?.tuple

export default {
  ...Setting,
  data () {
    return {
      urlField: '',
      socksField: false
    }
  },
  created () {
    Setting.created()
    this.urlField = getUrl(this.realDraftMode ? this.draft : this.state)
    this.socksField = getSocks(this.realDraftMode ? this.draft : this.state)
  },
  computed: {
    ...Setting.computed,
    // state that we'll show in the UI, i.e. transforming map into list
    displayState () {
      if (this.visibleState?.tuple) {
        return this.visibleState.tuple[1] + ':' + this.visibleState.tuple[2]
      }
      return this.visibleState
    },
    socksState () {
      return getSocks(this.visibleState)
    }
  },
  components: {
    ...Setting.components,
    Checkbox
  },
  methods: {
    ...Setting.methods,
    getValue ({ event, isProxy}) {
      if (isProxy) {
        this.socksField = event
      } else {
        this.urlField = event.target.value
      }

      if (this.socksField) {
        return { tuple: [ ':socks5', ...this.urlField.split(':') ] }
      } else {
        return this.urlField
      }
    }
  }
}
