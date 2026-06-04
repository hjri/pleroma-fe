import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useLocalConfigStore } from 'src/stores/local_config.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

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
      useSyncConfigStore().setSimplePrefAndSave({
        path: 'replyVisibility',
        value: visibility,
      })
      this.$store.dispatch('queueFlushAll')
    },
    openTab(tab) {
      useInterfaceStore().openSettingsModalTab(tab)
    },
  },
  computed: {
    ...mapState(useMergedConfigStore, ['mergedConfig']),
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
      set(value) {
        useLocalConfigStore().set({
          path: 'hideAttachments',
          value,
        })
        useLocalConfigStore().set({
          path: 'hideAttachmentsInConv',
          value,
        })
      },
    },
    hideMutedPosts: {
      get() {
        return this.mergedConfig.hideFilteredStatuses
      },
      set(value) {
        useSyncConfigStore().setSimplePrefAndSave({
          path: 'hideFilteredStatuses',
          value,
        })
      },
    },
    muteBotStatuses: {
      get() {
        return this.mergedConfig.muteBotStatuses
      },
      set(value) {
        useSyncConfigStore().setSimplePrefAndSave({
          path: 'muteBotStatuses',
          value,
        })
      },
    },
    muteSensitiveStatuses: {
      get() {
        return this.mergedConfig.muteSensitiveStatuses
      },
      set(value) {
        useSyncConfigStore().setSimplePrefAndSave({
          path: 'muteSensitiveStatuses',
          value,
        })
      },
    },
  },
}

export default QuickFilterSettings
