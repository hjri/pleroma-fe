import { useSyncConfigStore } from 'src/stores/sync_config.js'

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
      return useSyncConfigStore().mergedConfig.modalMobileCenter
    },
  },
}

export default DialogModal
