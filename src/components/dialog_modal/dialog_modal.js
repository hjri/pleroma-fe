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
      return this.$store.getters.mergedConfig.modalMobileCenter
    },
  },
}

export default DialogModal
