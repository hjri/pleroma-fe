import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown)

export default {
  inheritAttrs: false,
  props: {
    rootClass: String,
    modelValue: String,
    disabled: Boolean,
    unstyled: Boolean,
    kind: String,
  },
  computed: {
    inputAttrs() {
      const { class: _unused, ...rest } = this.$attrs

      return rest
    }
  },
  emits: ['update:modelValue'],
}
