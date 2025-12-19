import ListSetting from './list_setting.js'

export default {
  ...ListSetting,
  data () {
    return {
      newValue: ['','']
    }
  },
  methods: {
    ...ListSetting.methods,
    getValue ({ event, index, eventType, tuple }) {
      switch (eventType) {
        case 'add': {
          if (!this.newValue[0] || !this.newValue[1]) return this.visibleState
          const res = [...this.visibleState, this.newValue]
          this.newValue = ['', '']
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
          const item = this.visibleState[index]
          const string = event.target.value
          if (!string) return this.visibleState

          if (tuple === 0) {
            return [...pre, [string, item[1]], ...post]
          } else {
            return [...pre, [item[0], string], ...post]
          }
        }
      }
    }
  }
}
