import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  props: {
    ...Setting.props,
    overrideAvailableOptions: {
      required: false,
      type: Set
    }
  },
  components: {
    ...Setting.components,
    Checkbox
  },
  computed: {
    ...Setting.computed,
    availableOptions () {
      if (this.overrideAvailableOptions) {
        return new Set(this.overrideAvailableOptions)
      }
      return new Set(this.backendDescription?.suggestions.map((option) => ({
        label: option,
        value: option
      })))
    },
    valueSet () {
      return new Set(this.visibleState)
    }
  },
  methods: {
    ...Setting.methods,
    optionPresent (option) {
      return this.valueSet.has(option)
    },
    getValue ({ event, option }) {
      const set = new Set(this.visibleState)
      if (event) {
        set.add(option)
      } else {
        set.delete(option)
      }
      return [...set]
    }
  }
}
