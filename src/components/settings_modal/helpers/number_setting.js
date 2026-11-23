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
    realTruncate() {
      return this.truncate ?? this.definition?.truncate ?? 1
    },
  },
  methods: {
    ...Setting.methods,
    getValue(e) {
      if (e === undefined) return undefined
      if (this.realTruncate === 1) {
        return Number.parseInt(e)
      } else if (this.realTruncate > 1) {
        return Math.trunc(e / this.realTruncate) * this.realTruncate
      }
      return Number.parseFloat(e)
    },
  },
}
