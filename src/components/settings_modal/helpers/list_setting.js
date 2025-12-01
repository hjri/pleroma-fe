import Setting from './setting.js'

export default {
  ...Setting,
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
    updateValue (e) {
      console.log(e.target.value)
      //this.configSink(this.path, parseFloat(e.target.value) + this.stateUnit)
    }
  }
}
