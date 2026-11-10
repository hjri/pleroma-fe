import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

export default {
  ...Setting,
  data() {
    return {
      extraEntries: [],
      newValue: '',
    }
  },
  components: {
    ...Setting.components,
    Checkbox,
  },
  props: {
    ...Setting.props,
    ignoreSuggestions: {
      required: false,
      type: Boolean,
    },
    overrideAvailableOptions: {
      required: false,
      type: Boolean,
    },
    options: {
      required: false,
      type: Set,
    },
    allowNew: {
      required: false,
      type: Boolean,
      default: true,
    },
    forceNew: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...Setting.computed,
    showNew() {
      if (this.forceNew) return true
      if (!this.allowNew) return false

      const isExpert = useMergedConfigStore().mergedConfig.expertLevel > 0
      const hasBuiltins = this.builtinEntries.length > 0

      if (hasBuiltins) {
        return isExpert
      } else {
        return true
      }
    },
    valueSet() {
      return new Set(this.visibleState)
    },
    suggestionsSet() {
      const suggestions = this.realSuggestions
      if (suggestions) {
        return new Set(suggestions)
      } else {
        return new Set()
      }
    },
    builtinEntries() {
      if (this.ignoreSuggestions) return []
      if (this.overrideAvailableOptions) {
        return [...this.options]
      }
      if (!this.suggestionsSet) return []

      const builtins = [...this.suggestionsSet.values()]
      return builtins.map((option) => ({
        label: option,
        value: option,
      }))
    },
    builtinEntriesValueSet() {
      return new Set(this.builtinEntries.map((x) => x.value))
    },
    builtinEntriesSelected() {
      return new Set(
        this.builtinEntriesValueSet.values().filter((x) => {
          return this.valueSet.has(x)
        }),
      )
    },
    newValid() {
      return Boolean(this.newValue)
    },
  },
  methods: {
    ...Setting.methods,
    optionPresent(option) {
      return this.valueSet.has(option)
    },
    resetNew() {
      this.newValue = ''
    },
    getValue(e) {
      return e
    },
    update() {
      this.visibleState = [
        ...this.builtinEntriesSelected.values(),
        ...this.extraEntries,
      ]
    },
    toggle(event, value) {
      const newSet = new Set(this.builtinEntriesSelected)
      if (event) {
        newSet.add(value)
      } else {
        newSet.delete(value)
      }
      this.visibleState = [...newSet.values(), ...this.extraEntries]
    },
    add() {
      if (!this.newValid) return
      this.extraEntries = [...this.extraEntries, this.newValue]
      this.update()
      this.resetNew()
    },
    remove(index) {
      const pre = [...this.extraEntries].slice(0, index)
      const post = [...this.extraEntries].slice(index + 1)
      this.extraEntries = [...pre, ...post]
      this.update()
    },
    edit(event, index) {
      const string = event.target.value
      if (!string) return
      const pre = [...this.extraEntries].slice(0, index)
      const post = [...this.extraEntries].slice(index + 1)
      this.extraEntries = [...pre, string, ...post]
      this.update()
    },
  },
}
