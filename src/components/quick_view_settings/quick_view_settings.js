import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBars,
  faFolderTree,
  faList,
  faWrench,
} from '@fortawesome/free-solid-svg-icons'

library.add(faList, faFolderTree, faBars, faWrench)

const QuickViewSettings = {
  props: {
    conversation: Boolean,
  },
  components: {
    Popover,
    QuickFilterSettings,
  },
  methods: {
    openTab(tab) {
      useInterfaceStore().openSettingsModalTab(tab)
    },
  },
  computed: {
    ...mapState(useSyncConfigStore, ['mergedConfig']),
    ...mapState(useInterfaceStore, {
      mobileLayout: (state) => state.layoutType === 'mobile',
    }),
    loggedIn() {
      return !!this.$store.state.users.currentUser
    },
    conversationDisplay: {
      get() {
        return this.mergedConfig.conversationDisplay
      },
      set(value) {
        useSyncConfigStore().setPreference({
          path: 'simple.conversationDisplay',
          value,
        })
      },
    },
    autoUpdate: {
      get() {
        return this.mergedConfig.streaming
      },
      set() {
        const value = !this.autoUpdate
        useSyncConfigStore().setPreference({ path: 'simple.streaming', value })
      },
    },
    collapseWithSubjects: {
      get() {
        return this.mergedConfig.collapseMessageWithSubject
      },
      set() {
        const value = !this.collapseWithSubjects
        useSyncConfigStore().setPreference({
          path: 'simple.collapseMessageWithSubject',
          value,
        })
      },
    },
    showUserAvatars: {
      get() {
        return this.mergedConfig.mentionLinkShowAvatar
      },
      set() {
        const value = !this.showUserAvatars
        useSyncConfigStore().setPreference({
          path: 'simple.mentionLinkShowAvatar',
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
        useSyncConfigStore().setPreference({
          path: 'simple.muteBotStatuses',
          value,
        })
      },
    },
    muteSensitiveStatuses: {
      get() {
        return this.mergedConfig.muteSensitiveStatuses
      },
      set() {
        const value = !this.muteSensitiveStatuses
        useSyncConfigStore().setPreference({
          path: 'simple.muteSensitiveStatuses',
          value,
        })
      },
    },
  },
}

export default QuickViewSettings
