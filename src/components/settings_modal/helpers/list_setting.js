import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  data () {
    return {
      newValue: '',
    }
  },
  components: {
    ...Setting.components,
    Checkbox
  },
  props: {
    ...Setting.props,
    ignoreSuggestions: {
      required: false,
      type: Boolean
    },
    overrideAvailableOptions: {
      required: false,
      type: Set
    },
    allowNew: {
      required: false,
      type: Boolean,
      default: true
    },
    forceNew: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...Setting.computed,
    showNew () {
      if (this.forceNew) return true
      if (!this.allowNew) return false

      const isExpert = this.$store.state.config.expertLevel > 0
      const hasBuiltins = this.builtinEntries.length > 0

      if (hasBuiltins) {
        return isExpert
      } else {
        return true
      }
    },
    valueSet () {
      return new Set(this.visibleState)
    },
    suggestionsSet () {
      const suggestions = this.backendDescriptionSuggestions
      if (suggestions) {
        return new Set(suggestions)
      } else {
        return new Set()
      }
    },
    extraEntries () {
      if (this.ignoreSuggestions) return [...this.valueSet.values()]
      if (!this.suggestionsSet) return []
      return [...this.valueSet.values()].filter((x) => {
        return !this.suggestionsSet?.has(x)
      })
    },
    builtinEntries () {
      if (this.ignoreSuggestions) return []
      if (this.overrideAvailableOptions) {
        return [...this.overrideAvailableOptions]
      }
      if (!this.suggestionsSet) return []

      const builtins = [...this.suggestionsSet.values()]
      return builtins.map((option) => ({
        label: option,
        value: this.valueSet.has(option)
      }))
    }
  },
  methods: {
    ...Setting.methods,
    optionPresent (option) {
      return this.valueSet.has(option)
    },
    getValue ({ event, index, eventType }) {
      switch (eventType) {
        case 'toggle': {
          this.newValue = ''
          return [...this.visibleState, event]
        }

        case 'add': {
          const res = [...this.visibleState, this.newValue]
          this.newValue = ''
          return res
        }

        case 'remove': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)

          return [...pre, ...post]
        }

        case 'edit': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)
          const string = event?.target?.value

          return [...pre, string, ...post]
        }
      }
    }
  }
}
