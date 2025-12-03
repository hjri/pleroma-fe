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
      type: Set,
      default: true
    }
  },
  computed: {
    ...Setting.computed,
    valueSet () {
      return new Set(this.visibleState)
    },
    suggestions () {
      const suggestions = this.backendDescription?.suggestions
      if (suggestions) {
        return new Set(this.backendDescription.suggestions)
      } else {
        return new Set()
      }
    },
    extraEntries () {
      if (this.ignoreSuggestions) return [...this.valueSet.values()]
      return [...this.valueSet.values()].filter((x) => {
        return !this.suggestions?.has(x)
      })
    },
    builtinEntries () {
      if (this.ignoreSuggestions) return []
      if (this.overrideAvailableOptions) {
        return [...this.overrideAvailableOptions]
      }

      const builtins = [...this.valueSet.values()].filter((x) => {
        return this.suggestions.has(x)
      })

      return builtins.map((option) => ({
        label: option,
        value: option
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
