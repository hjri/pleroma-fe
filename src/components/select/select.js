import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown)

export default {
  emits: ['update:modelValue'],
  props: {
    modelValue: String,
    disabled: Boolean,
    unstyled: Boolean,
    kind: String,
  },
  inheritAttrs: false,
}
