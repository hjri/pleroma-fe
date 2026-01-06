import { cacheKey, clearCache, emojiCacheKey } from 'src/services/sw/sw.js'
import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

const pleromaFeCommitUrl =
  'https://git.pleroma.social/pleroma/pleroma-fe/commit/'

const VersionTab = {
  data() {
    const instance = this.$store.state.instance
    return {
      backendVersion: instance.backendVersion,
      backendRepository: instance.backendRepository,
      frontendVersion: instance.frontendVersion,
    }
  },
  components: {
    BooleanSetting,
  },
  computed: {
    frontendVersionLink() {
      return pleromaFeCommitUrl + this.frontendVersion
    },
    ...SharedComputedObject(),
  },
  methods: {
    clearAssetCache() {
      this.clearCache(cacheKey)
    },
    clearEmojiCache() {
      this.clearCache(emojiCacheKey)
    },
    clearCache(key) {
      clearCache(key)
        .then(() => {
          this.$store.dispatch('settingsSaved', { success: true })
        })
        .catch((error) => {
          this.$store.dispatch('settingsSaved', { error })
        })
    },
  },
}

export default VersionTab
