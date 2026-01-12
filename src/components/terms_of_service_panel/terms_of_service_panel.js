const TermsOfServicePanel = {
  computed: {
    content() {
      return this.$store.state.instance.tos
    },
    embedded() {
      return this.$store.state.instance.embeddedToS
    },
  },
}

export default TermsOfServicePanel
