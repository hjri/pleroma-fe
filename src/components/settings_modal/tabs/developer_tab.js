import BooleanSetting from '../helpers/boolean_setting.vue'

import SharedComputedObject from '../helpers/shared_computed_object.js'

import { clearCache, cacheKey, emojiCacheKey } from 'src/services/sw/sw.js'

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
  components: {
    BooleanSetting
  },
  computed: {
    frontendVersionLink () {
      return pleromaFeCommitUrl + this.frontendVersion
    },
    ...SharedComputedObject(),
  }
}

export default VersionTab
