import Checkbox from 'src/components/checkbox/checkbox.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  data() {
    return {
      newValue: '',
    }
  },
  components: {
    ...Setting.components,
    Checkbox,
  },
  props: {
    ...Setting.props,
  },
  computed: {
    ...Setting.computed,
    isSeparate() {
      // [[a1, b1], [a2, b2]] vs [a, b]
      return Array.isArray(this.visibleState[0])
    },
    normalizedState() {
      if (this.isSeparate) {
        return this.visibleState.map((y) => y.map((x) => Number(x) || 0))
      } else {
        return [this.visibleState.map((x) => Number(x) || 0)]
      }
    },
  },
  methods: {
    ...Setting.methods,
    edit({ event, side, index }) {
      const value = Number(event.target.value)
      if (Number.isNaN(value)) return this.visibleState

      const newVal = [...this.normalizedState.map((x) => [...x])]
      newVal[side][index] = value
      this.visibleState = newVal
    },
    toggleMode(event) {
      if (event === 'split') {
        this.visibleState = [this.normalizedState[0], this.normalizedState[0]]
      } else if (event === 'join') {
        this.visibleState = this.normalizedState[0]
      }
    },
  },
}
