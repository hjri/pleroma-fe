import { useInstanceStore } from 'src/stores/instance.js'

const TermsOfServicePanel = {
  computed: {
    content() {
      return useInstanceStore().tos
    },
    embedded() {
      return useInstanceStore().embeddedToS
    },
  },
}

export default TermsOfServicePanel
