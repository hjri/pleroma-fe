import Setting from './setting.js'

export default {
  ...Setting,
  data () {
    return {
      newValue: ''
    }
  },
  components: {
    ...Setting.components
  },
  props: {
    ...Setting.props
  },
  computed: {
    ...Setting.computed
  },
  methods: {
    ...Setting.methods,
    addNew () {
      this.update({ newValue: this.newValue })
    },
    getValue ({ event, index, newValue, remove }) {
      if (newValue) {
        this.newValue = ''
        return [...this.visibleState, newValue]
      } else if (remove) {
        const pre = this.visibleState.slice(0, index)
        const post = this.visibleState.slice(index + 1)

        return [...pre, ...post]
      } else {
        const pre = this.visibleState.slice(0, index)
        const post = this.visibleState.slice(index + 1)
        const string = event?.target?.value

        return [...pre, string, ...post]
      }
    }
  }
}
