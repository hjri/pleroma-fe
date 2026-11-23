import Setting from './setting.js'

export default {
  ...Setting,
  props: {
    ...Setting.props,
    allowNew: {
      required: false,
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      newValue: ['', ''], // avoiding extra complexity by just using an array instead of an object
    }
  },
  computed: {
    ...Setting.computed,
    // state that we'll show in the UI, i.e. transforming map into list
    displayState() {
      return Object.entries(this.visibleState)
    },
  },
  methods: {
    ...Setting.methods,
    getValue(e) {
      return e
    },
    add() {
      if (!this.newValue[0]) return
      this.visibleState = {
        ...this.visibleState,
        ...Object.fromEntries([this.newValue]),
      }
      this.newValue = ['', '']
    },
    remove(key) {
      // initial state for this type is empty array
      if (Array.isArray(this.visibleState)) return
      const newEntries = Object.entries(this.visibleState).filter(
        ([k]) => k !== key,
      )

      if (newEntries.length === 0) {
        this.visibleState = []
      } else {
        this.visibleState = Object.fromEntries(newEntries)
      }
    },
    edit({ event, key, isKey }) {
      const string = event.target.value
      const newEntries = Object.entries(this.visibleState).map(([k, v]) => {
        if (isKey) {
          if (k === key) {
            return [string, v]
          } else {
            return [k, v]
          }
        } else {
          if (k === key) {
            return [k, string]
          } else {
            return [k, v]
          }
        }
      })

      this.visibleState = Object.fromEntries(newEntries)
    },
  },
}
