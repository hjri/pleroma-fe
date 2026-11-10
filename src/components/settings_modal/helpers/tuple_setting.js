import Setting from './setting.js'

export default {
  ...Setting,
  computed: {
    ...Setting.computed,
    guardedState() {
      return this.visibleState?.tuple ?? []
    },
    a: {
      get() {
        return this.guardedState[0]
      },
      set(e) {
        const string = e.target.value
        this.visibleState = { tuple: [string, this.guradredState[1]] }
      },
    },
    b: {
      get() {
        return this.guardedState[1]
      },
      set(e) {
        const string = e.target.value
        this.visibleState = { tuple: [this.guradredState[0], string] }
      },
    },
  },
}
