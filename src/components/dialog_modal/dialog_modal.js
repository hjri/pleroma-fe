import { useId } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

const DialogModal = {
  props: {
    darkOverlay: {
      default: true,
      type: Boolean,
    },
    onCancel: {
      default: () => {
        /* no-op */
      },
      type: Function,
    },
  },
  setup() {
    const uniqueId = useId()

    return { uniqueId }
  },
  computed: {
    mobileCenter() {
      return useMergedConfigStore().mergedConfig.modalMobileCenter
    },
  },
}

export default DialogModal
