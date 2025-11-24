const pleromaFeCommitUrl = 'https://git.pleroma.social/pleroma/pleroma-fe/commit/'

const VersionTab = {
  data () {
    const instance = this.$store.state.instance
    return {
      backendVersion: instance.backendVersion,
      backendRepository: instance.backendRepository,
      frontendVersion: instance.frontendVersion
    }
  },
  computed: {
    frontendVersionLink () {
      return pleromaFeCommitUrl + this.frontendVersion
    }
  }
}

export default VersionTab
