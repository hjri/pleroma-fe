import { mapActions, mapState } from 'pinia'

import ErrorModal from 'src/components/error_modal/error_modal.vue'

import { useInterfaceStore } from 'src/stores/interface.js'

const GlobalError = {
  components: {
    ErrorModal,
  },
  computed: {
    title() {
      if (this.globalError == null) return null
      return this.globalError.title && this.$t(this.globalError.title)
    },
    content() {
      if (this.globalError == null) return null
      if (this.globalError.content) {
        return this.$t(this.globalError.content, [this.globalError.error])
      } else {
        return null
      }
    },
    details() {
      if (this.globalError == null) return null
      if (this.globalError.error != null) {
        return (
          this.globalError.error.toString() +
          '\n\n' +
          this.globalError.error.stack
        )
      } else {
        return this.globalError.details
      }
    },
    recoverText() {
      if (this.globalError == null) return null
      if (this.globalError.recoverText == null) return null
      return this.$t(this.globalError.recoverText)
    },
    ...mapState(useInterfaceStore, ['globalError']),
  },
  methods: {
    clear() {
      this.globalError.clear?.()
      this.clearGlobalError()
    },
    recover() {
      this.globalError.recover?.()
      this.clearGlobalError()
    },
    ...mapActions(useInterfaceStore, ['clearGlobalError']),
  },
}

export default GlobalError
