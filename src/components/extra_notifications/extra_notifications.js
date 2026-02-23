import { mapState as mapPiniaState } from 'pinia'
import { mapGetters } from 'vuex'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBullhorn,
  faComments,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons'

library.add(faUserPlus, faComments, faBullhorn)

const ExtraNotifications = {
  computed: {
    shouldShowChats() {
      return (
        this.mergedConfig.showExtraNotifications &&
        this.mergedConfig.showChatsInExtraNotifications &&
        this.unreadChatCount
      )
    },
    shouldShowAnnouncements() {
      return (
        this.mergedConfig.showExtraNotifications &&
        this.mergedConfig.showAnnouncementsInExtraNotifications &&
        this.unreadAnnouncementCount
      )
    },
    shouldShowFollowRequests() {
      return (
        this.mergedConfig.showExtraNotifications &&
        this.mergedConfig.showFollowRequestsInExtraNotifications &&
        this.followRequestCount
      )
    },
    hasAnythingToShow() {
      return (
        this.shouldShowChats ||
        this.shouldShowAnnouncements ||
        this.shouldShowFollowRequests
      )
    },
    shouldShowCustomizationTip() {
      return (
        this.mergedConfig.showExtraNotificationsTip && this.hasAnythingToShow
      )
    },
    currentUser() {
      return this.$store.state.users.currentUser
    },
    ...mapGetters(['unreadChatCount', 'followRequestCount', 'mergedConfig']),
    ...mapPiniaState(useAnnouncementsStore, {
      unreadAnnouncementCount: 'unreadAnnouncementCount',
    }),
  },
  methods: {
    openNotificationSettings() {
      return useInterfaceStore().openSettingsModalTab('notifications')
    },
    dismissConfigurationTip() {
      return useSyncConfigStore().setSimplePrefAndSave({
        path: 'showExtraNotificationsTip',
        value: false,
      })
    },
  },
}

export default ExtraNotifications
