import { mapState } from 'pinia'
import { mapGetters } from 'vuex'

import { useInterfaceStore } from 'src/stores/interface'
import Popover from '../popover/popover.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faFilter, faFont, faWrench } from '@fortawesome/free-solid-svg-icons'

library.add(faFilter, faFont, faWrench)

const QuickFilterSettings = {
  props: {
    conversation: Boolean,
    nested: Boolean,
  },
  components: {
    Popover,
  },
  methods: {
    setReplyVisibility(visibility) {
      this.$store.dispatch('setOption', {
        name: 'replyVisibility',
        value: visibility,
      })
      this.$store.dispatch('queueFlushAll')
    },
    openTab(tab) {
      useInterfaceStore().openSettingsModalTab(tab)
    },
  },
  computed: {
    ...mapGetters(['mergedConfig']),
    ...mapState(useInterfaceStore, {
      mobileLayout: (state) => state.layoutType === 'mobile',
    }),
    triggerAttrs() {
      if (this.mobileLayout) {
        return {}
      } else {
        return {
          title: this.$t('timeline.quick_filter_settings'),
        }
      }
    },
    mainClass() {
      if (this.mobileLayout) {
        return 'main-button'
      } else {
        return 'dropdown-item'
      }
    },
    loggedIn() {
      return !!this.$store.state.users.currentUser
    },
    replyVisibilitySelf: {
      get() {
        return this.mergedConfig.replyVisibility === 'self'
      },
      set() {
        this.setReplyVisibility('self')
      },
    },
    replyVisibilityFollowing: {
      get() {
        return this.mergedConfig.replyVisibility === 'following'
      },
      set() {
        this.setReplyVisibility('following')
      },
    },
    replyVisibilityAll: {
      get() {
        return this.mergedConfig.replyVisibility === 'all'
      },
      set() {
        this.setReplyVisibility('all')
      },
    },
    hideMedia: {
      get() {
        return (
          this.mergedConfig.hideAttachments ||
          this.mergedConfig.hideAttachmentsInConv
        )
      },
      set() {
        const value = !this.hideMedia
        this.$store.dispatch('setOption', { name: 'hideAttachments', value })
        this.$store.dispatch('setOption', {
          name: 'hideAttachmentsInConv',
          value,
        })
      },
    },
    hideMutedPosts: {
      get() {
        return this.mergedConfig.hideFilteredStatuses
      },
      set() {
        const value = !this.hideMutedPosts
        this.$store.dispatch('setOption', {
          name: 'hideFilteredStatuses',
          value,
        })
      },
    },
    muteBotStatuses: {
      get() {
        return this.mergedConfig.muteBotStatuses
      },
      set() {
        const value = !this.muteBotStatuses
        this.$store.dispatch('setOption', { name: 'muteBotStatuses', value })
      },
    },
    muteSensitiveStatuses: {
      get() {
        return this.mergedConfig.muteSensitiveStatuses
      },
      set() {
        const value = !this.muteSensitiveStatuses
        this.$store.dispatch('setOption', {
          name: 'muteSensitiveStatuses',
          value,
        })
      },
    },
  },
}

export default QuickFilterSettings
