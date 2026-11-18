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
      set(string) {
        this.visibleState = { tuple: [string, this.guardedState[1]] }
      },
    },
    b: {
      get() {
        return this.guardedState[1]
      },
      set(string) {
        this.visibleState = { tuple: [this.guardedState[0], string] }
      },
    },
  },
}
