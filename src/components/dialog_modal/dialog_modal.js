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
  computed: {
    mobileCenter() {
      return useMergedConfigStore().mergedConfig.modalMobileCenter
    },
  },
}

export default DialogModal
