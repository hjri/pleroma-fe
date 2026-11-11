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
    step: Number,
    units: Array,
    unitSet: String,
    resetDefault: Object,
  },
  computed: {
    ...Setting.computed,
    realUnits() {
      return this.units ?? this.definition?.units ?? allCssUnits
    },
    realUnitSet() {
      return this.unitSet ?? this.definition?.unitSet ?? 'none'
    },
    realMin() {
      return this.min ?? this.definition?.min ?? 0
    },
    realStep() {
      return this.step ?? this.definition?.step ?? 1
    },
    realResetDefault() {
      return this.resetDefault ?? this.definition?.resetDefault
    },
    stateUnit: {
      get() {
        return typeof this.visibleState === 'string'
          ? this.visibleState.replace(/[0-9,.]+/, '')
          : ''
      },
      set(newUnit) {
        let value = this.stateValue

        if (this.realResetDefault) {
          const replaceValue = this.realResetDefault[newUnit]
          if (replaceValue != null) {
            value = replaceValue
          }
        }

        this.visibleState = value + newUnit
      },
    },
    stateValue: {
      get() {
        return typeof this.visibleState === 'string'
          ? this.visibleState.replace(/[^0-9,.]+/, '')
          : ''
      },
      set(e) {
        const value = Number.parseFloat(e.target.value)
        this.visibleState = value + this.stateUnit
      },
    },
  },
  methods: {
    ...Setting.methods,
    getUnitString(value) {
      if (this.realUnitSet === 'none') return value
      return this.$t(['settings', 'units', this.realUnitSet, value].join('.'))
    },
  },
}
