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
    edit(event, editIndex, tuple) {
      const string = event.target.value
      if (!string) return

      const clone = [...this.extraEntries]
      const subject = clone.find(({ index }) => index === editIndex)


      if (tuple === 0) {
        subject.value = [string, subject.value[1]]
      } else {
        subject.value = [subject.value[0], string]
      }
      this.extraEntries = clone
    },
  },
}
