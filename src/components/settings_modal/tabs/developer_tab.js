import { mapState } from 'pinia'
import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'

import { useInstanceStore } from 'src/stores/instance.js'

import { cacheKey, clearCache, emojiCacheKey } from 'src/services/sw/sw.js'

const pleromaFeCommitUrl =
  'https://git.pleroma.social/pleroma/pleroma-fe/commit/'

const VersionTab = {
  components: {
    BooleanSetting,
  },
  computed: {
    frontendVersionLink() {
      return pleromaFeCommitUrl + this.frontendVersion
    },
    ...mapState(useInstanceStore, ['backendVersion', 'backendRepository', 'frontendVersion']),
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
