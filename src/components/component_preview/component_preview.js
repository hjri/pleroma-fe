import Checkbox from 'src/components/checkbox/checkbox.vue'
import ColorInput from 'src/components/color_input/color_input.vue'
import genRandomSeed from 'src/services/random_seed/random_seed.service.js'
import {
  adoptStyleSheets,
  createStyleSheet,
} from 'src/services/style_setter/style_setter.js'

export default {
  components: {
    Checkbox,
    ColorInput,
  },
  props: [
    'shadow',
    'shadowControl',
    'previewClass',
    'previewStyle',
    'previewCss',
    'disabled',
    'invalid',
    'noColorControl',
  ],
  emits: ['update:shadow'],
  data() {
    return {
      colorOverride: undefined,
      lightGrid: false,
      zoom: 100,
      randomSeed: genRandomSeed(),
    }
  },
  mounted() {
    this.update()
  },
  computed: {
    hideControls() {
      return typeof this.shadow === 'string'
    },
  },
  watch: {
    previewCss() {
      this.update()
    },
    previewStyle() {
      this.update()
    },
    zoom() {
      this.update()
    },
  },
  methods: {
    updateProperty(axis, value) {
      this.$emit('update:shadow', { axis, value: Number(value) })
    },
    update() {
      const sheet = createStyleSheet('style-component-preview', 90)

      sheet.clear()

      const result = [this.previewCss]
      if (this.colorOverride) result.push(`--background: ${this.colorOverride}`)

      const styleRule = [
        '#component-preview-',
        this.randomSeed,
        ' {\n',
        '.preview-block {\n',
        `zoom: ${this.zoom / 100};`,
        this.previewStyle,
        '\n}',
        '\n}',
      ].join('')

      sheet.addRule(styleRule)
      sheet.addRule(
        ['#component-preview-', this.randomSeed, ' {\n', ...result, '\n}'].join(
          '',
        ),
      )

      sheet.ready = true
      adoptStyleSheets()
    },
  },
}
