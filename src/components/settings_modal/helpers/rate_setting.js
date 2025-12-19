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
    ...Setting.props
  },
  computed: {
    ...Setting.computed,
    isSeparate () {
      // [[a1, b1], [a2, b2]] vs [a, b]
      return Array.isArray(this.visibleState[0])
    },
    normalizedState () {
      if (this.isSeparate) {
        return this.visibleState.map(y => y.map(x => Number(x) || 0))
      } else {
        return [this.visibleState.map(x => Number(x) || 0)]
      }
    }
  },
  methods: {
    ...Setting.methods,
    getValue ({ event, side, index, eventType }) {
      if (eventType === 'edit') {
        const value = Number(event.target.value)
        if (Number.isNaN(value)) return this.visibleState

        const newVal = [...this.normalizedState.map(x => [...x])]
        newVal[side][index] = value
        return newVal
      }

      if (eventType === 'toggleMode') {
        if (event === 'split') {
          return [this.normalizedState[0], this.normalizedState[0]]
        } else if (event === 'join') {
          return [this.normalizedState[0]]
        }
      }
    }
  }
}
