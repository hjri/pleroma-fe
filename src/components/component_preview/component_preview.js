import Checkbox from 'src/components/checkbox/checkbox.vue'
import ColorInput from 'src/components/color_input/color_input.vue'

import genRandomSeed from 'src/services/random_seed/random_seed.service.js'

export default {
  components: {
    Checkbox,
    ColorInput
  },
  props: [
    'shadow',
    'shadowControl',
    'previewClass',
    'previewStyle',
    'previewCss',
    'disabled',
    'invalid',
    'noColorControl'
  ],
  emits: ['update:shadow'],
  data () {
    return {
      colorOverride: undefined,
      lightGrid: false,
      zoom: 100,
      randomSeed: genRandomSeed()
    }
  },
  computed: {
    hideControls () {
      return typeof this.shadow === 'string'
    }
  },
  watch: {
    previewCss () {
      this.update()
    },
    previewStyle () {
      this.update()
    },
    zoom () {
      this.update()
    }
  },
  methods: {
    updateProperty (axis, value) {
      this.$emit('update:shadow', { axis, value: Number(value) })
    },
    update () {
      const styleEl = document.getElementById('component-style-holder')
      const styleSheet = styleEl.sheet

      for (let i = styleEl.sheet.cssRules.length - 1; i >= 0; --i) {
        styleEl.sheet.deleteRule(i)
      }

      const result = []

      if (this.colorOverride) result.push(`--background: ${this.colorOverride}`)

      const styleRule = [
        '#component-preview-', this.randomSeed, ' {\n',
        '.preview-block {\n',
        `zoom: ${this.zoom / 100};`,
        this.previewStyle,
        '\n}',
        '\n}'
      ].join('')

      styleSheet.insertRule(styleRule)
      styleSheet.insertRule([
        '#component-preview-', this.randomSeed, ' {\n',
        this.previewCss,
        ...result,
        '\n}'
      ].join(''), 'index-max')
    }
  }
}
