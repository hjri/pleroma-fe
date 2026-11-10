import ListSetting from './list_setting.js'

export default {
  ...ListSetting,
  data() {
    return {
      newValue: ['', ''],
    }
  },
  computed: {
    ...ListSetting.computed,
    newValid() {
      return Boolean(this.newValue[0]) && Boolean(this.newValue[1])
    },
  },
  methods: {
    ...ListSetting.methods,
    resetNew() {
      this.newValue = ['', '']
    },
    edit(event, index, tuple) {
      const string = event.target.value
      if (!string) return

      const pre = this.extraEntries.slice(0, index)
      const post = this.extraEntries.slice(index + 1)
      const item = this.extraEntries[index]

      if (tuple === 0) {
        this.extraEntries = [...pre, [string, item[1]], ...post]
      } else {
        this.extraEntries = [...pre, [item[0], string], ...post]
      }
      this.update()
    },
  },
}
