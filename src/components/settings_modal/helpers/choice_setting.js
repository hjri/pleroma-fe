import Select from 'src/components/select/select.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    Select
  },
  props: {
    ...Setting.props,
    overrideOptions: {
      type: Boolean,
      required: false
    },
    options: {
      type: Array,
      required: false
    },
    optionLabelMap: {
      type: Object,
      required: false,
      default: {}
    }
  },
  computed: {
    ...Setting.computed,
    realOptions () {
      if (this.overrideOptions) {
        return this.options
      }
      if (this.realSource === 'admin') {
        if (
          !this.backendDescriptionSuggestions?.length ||
            this.backendDescriptionSuggestions?.length === 0
        ) {
          return this.options
        }
        return this.backendDescriptionSuggestions.map(x => ({
          key: x,
          value: x,
          label: this.optionLabelMap[x] || x
        }))
      }
      return this.options
    }
  },
  methods: {
    ...Setting.methods,
    getValue (e) {
      return e
    }
  }
}
