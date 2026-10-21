import { mapState } from 'pinia'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useChatsStore } from 'src/stores/chats.js'
import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

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
        this.unreadChatsCount
      )
    },
    shouldShowAnnouncements() {
      return (
        this.mergedConfig.showExtraNotifications &&
        this.mergedConfig.showAnnouncementsInExtraNotifications &&
        this.unreadAnnouncementsCount
      )
    },
    shouldShowFollowRequests() {
      return (
        this.mergedConfig.showExtraNotifications &&
        this.mergedConfig.showFollowRequestsInExtraNotifications &&
        this.followRequestsCount
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
      return useUsersStore().currentUser
    },
    ...mapState(useAnnouncementsStore, {
      unreadAnnouncementsCount: 'unreadAnnouncementsCount',
    }),
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    ...mapState(useChatsStore, ['unreadChatsCount']),
    ...mapState(useFollowRequestsStore, ['followRequestsCount']),
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
