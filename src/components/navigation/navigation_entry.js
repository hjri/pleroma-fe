import { mapState, mapStores } from 'pinia'

import { routeTo } from 'src/components/navigation/navigation.js'
import OptionalRouterLink from 'src/components/optional_router_link/optional_router_link.vue'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useChatsStore } from 'src/stores/chats.js'
import { useDraftsStore } from 'src/stores/drafts.js'
import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faThumbtack } from '@fortawesome/free-solid-svg-icons'

library.add(faThumbtack)

const NavigationEntry = {
  props: ['item', 'showPin'],
  components: {
    OptionalRouterLink,
  },
  methods: {
    isPinned(value) {
      return this.pinnedItems.has(value)
    },
    togglePin(value) {
      if (this.isPinned(value)) {
        useSyncConfigStore().removeCollectionPreference({
          path: 'collections.pinnedNavItems',
          value,
        })
      } else {
        useSyncConfigStore().addCollectionPreference({
          path: 'collections.pinnedNavItems',
          value,
        })
      }
      useSyncConfigStore().pushSyncConfig()
    },
  },
  computed: {
    routeTo() {
      return routeTo(this.item, this.currentUser)
    },
    badges() {
      return {
        drafts: this.draftsCount,
        unreadAnnouncements: this.unreadAnnouncementsCount,
        followRequests: this.followRequestsCount,
        unreadChats: this.unreadChatsCount,
      }
    },
    ...mapStores(useAnnouncementsStore),
    ...mapState(useDraftsStore, ['draftsCount']),
    ...mapState(useUsersStore, ['currentUser']),
    ...mapState(useChatsStore, ['unreadChatsCount']),
    ...mapState(useFollowRequestsStore, ['followRequestsCount']),
    ...mapState(useSyncConfigStore, {
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems),
    }),
  },
}

export default NavigationEntry
