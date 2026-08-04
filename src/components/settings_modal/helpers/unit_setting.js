import Select from 'src/components/select/select.vue'
import Setting from './setting.js'

export const allCssUnits = [
  'cm',
  'mm',
  'in',
  'px',
  'pt',
  'pc',
  'em',
  'ex',
  'ch',
  'rem',
  'vw',
  'vh',
  'vmin',
  'vmax',
  '%',
]
export const defaultHorizontalUnits = ['px', 'rem', 'vw']
export const defaultVerticalUnits = ['px', 'rem', 'vh']

export default {
  ...Setting,
  components: {
    ...Setting.components,
    Select,
  },
  props: {
    ...Setting.props,
    min: Number,
    units: {
      type: Array,
      default: () => allCssUnits,
    },
    unitSet: {
      type: String,
      default: 'none',
    },
    step: {
      type: Number,
      default: 1,
    },
    resetDefault: {
      type: Object,
      default: null,
    },
  },
  computed: {
    ...Setting.computed,
    stateUnit() {
      return typeof this.state === 'string'
        ? this.state.replace(/[0-9,.]+/, '')
        : ''
    },
    stateValue() {
      return typeof this.state === 'string'
        ? this.state.replace(/[^0-9,.]+/, '')
        : ''
    },
  },
  methods: {
    ...Setting.methods,
    getUnitString(value) {
      if (this.unitSet === 'none') return value
      return this.$t(['settings', 'units', this.unitSet, value].join('.'))
    },
    updateValue(e) {
      this.configSink(
        this.path,
        Number.parseFloat(e.target.value) + this.stateUnit,
      )
    },
    updateUnit(e) {
      let value = this.stateValue
      const newUnit = e.target.value
      if (this.resetDefault) {
        const replaceValue = this.resetDefault[newUnit]
        if (replaceValue != null) {
          value = replaceValue
        }
      }
      this.configSink(this.path, value + newUnit)
    },
  },
}
