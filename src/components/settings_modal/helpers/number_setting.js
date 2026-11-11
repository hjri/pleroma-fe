import Setting from './setting.js'

export default {
  ...Setting,
  props: {
    ...Setting.props,
    min: Number,
    max: Number,
    step: Number,
    truncate: Number,
  },
  computed: {
    ...Setting.computed,
    realMin() {
      return this.min ?? this.definition?.min ?? 0
    },
    realMax() {
      return this.max ?? this.definition?.max
    },
    realStep() {
      return this.step ?? this.definition?.step
    },
  },
  methods: {
    ...Setting.methods,
    getValue(e) {
      if (this.truncate === 1) {
        return Number.parseInt(e.target.value)
      } else if (this.truncate > 1) {
        return Math.trunc(e.target.value / this.truncate) * this.truncate
      }
      return Number.parseFloat(e.target.value)
    },
  },
}
