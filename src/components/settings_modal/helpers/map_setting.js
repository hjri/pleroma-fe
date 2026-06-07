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
    getValue({ event, key, eventType, isKey }) {
      switch (eventType) {
        case 'add': {
          if (key === '') return this.visibleState
          const res = {
            ...this.visibleState,
            ...Object.fromEntries([this.newValue]),
          }
          this.newValue = ['', '']
          return res
        }

        case 'remove': {
          // initial state for this type is empty array
          if (Array.isArray(this.visibleState)) return this.visibleState
          const newEntries = Object.entries(this.visibleState).filter(
            ([k]) => k !== key,
          )

          if (newEntries.length === 0) return []
          return Object.fromEntries(newEntries)
        }

        case 'edit': {
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

          return Object.fromEntries(newEntries)
        }
      }
    },
  },
}
