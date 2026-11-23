import Select from 'src/components/select/select.vue'
import Setting from './setting.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    Select,
  },
  props: {
    ...Setting.props,
    overrideOptions: {
      type: Boolean,
      required: false,
    },
    options: {
      type: Array,
      required: false,
    },
    optionLabelMap: {
      type: Object,
      required: false,
      default: {},
    },
  },
  computed: {
    ...Setting.computed,
    realOptions() {
      if (this.overrideOptions) {
        return this.options
      }
      if (this.realSource === 'admin') {
        if (
          !this.realSuggestions?.length ||
          this.realSuggestions?.length === 0
        ) {
          return this.options
        }
        return this.realSuggestions.map((x) => ({
          key: x,
          value: x,
          label: this.optionLabelMap[x] || x,
        }))
      }
      if (this.definition?.options) {
        return this.definition.options.map((option) => {
          const [key, value] = Array.isArray(option) ? option : [option, option]
          return {
            key,
            value,
            label: this.$t(this.definition.optionLabel(key, value)),
          }
        })
      }
      return this.options
    },
    localizedPlaceholder() {
      if (!this.realOptions) return ''
      const option = this.realOptions?.find(
        ({ key }) => key === this.realPlaceholder,
      )
      if (!option) return ''

      const defaultString =
        option.value === this.defaultState
          ? this.$t('settings.instance_default_simple')
          : ''
      return option.label + defaultString
    },
  },
}
