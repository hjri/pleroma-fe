import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleXmark)

/**
 * This component emits the following events:
 * cancelled, emitted when the action should not be performed;
 * accepted, emitted when the action should be performed;
 *
 * The caller should close this dialog after receiving any of the two events.
 */
const ErrorModal = {
  components: {
    DialogModal,
  },
  props: {
    title: {
      type: String,
    },
    clearText: {
      type: String,
    },
    recoverText: {
      type: String,
    },
    error: {
      type: Error,
    },
  },
  emits: ['clear', 'recover']
}

export default ErrorModal
