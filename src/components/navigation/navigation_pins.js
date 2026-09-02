import { mapState } from 'pinia'

import {
  filterNavigation,
  getBookmarkFolderEntries,
  getListEntries,
} from 'src/components/navigation/filter.js'
import {
  ROOT_ITEMS,
  routeTo,
  TIMELINES,
} from 'src/components/navigation/navigation.js'

import { useAnnouncementsStore } from 'src/stores/announcements'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders'
import { useChatsStore } from 'src/stores/chats.js'
import { useDraftsStore } from 'src/stores/drafts.js'
import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useListsStore } from 'src/stores/lists'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBookmark,
  faCity,
  faComments,
  faEnvelope,
  faGlobe,
  faInfoCircle,
  faList,
  faStream,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faUsers,
  faGlobe,
  faCity,
  faBookmark,
  faEnvelope,
  faComments,
  faBell,
  faInfoCircle,
  faStream,
  faList,
)

const NavPanel = {
  props: ['limit'],
  methods: {
    getRouteTo(item) {
      return routeTo(item, this.currentUser)
    },
  },
  components: {},
  computed: {
    badges() {
      return {
        drafts: this.draftsCount,
        unreadAnnouncements: this.unreadAnnouncementsCount,
        followRequests: this.followRequestsCount,
        unreadChats: this.unreadChatsCount,
      }
    },
    ...mapState(useListsStore, {
      lists: getListEntries,
    }),
    ...mapState(useAnnouncementsStore, {
      supportsAnnouncements: (store) => store.supportsAnnouncements,
      unreadAnnouncementsCount: 'unreadAnnouncementsCount',
    }),
    ...mapState(useDraftsStore, ['draftsCount']),
    ...mapState(useFollowRequestsStore, ['followRequestsCount']),
    ...mapState(useBookmarkFoldersStore, {
      bookmarks: getBookmarkFolderEntries,
    }),
    ...mapState(useChatsStore, ['unreadChatsCount']),
    ...mapState(useSyncConfigStore, {
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems),
    }),
    ...mapState(useInstanceStore, ['privateMode', 'federating']),
    ...mapState(useInstanceCapabilitiesStore, [
      'pleromaChatMessagesAvailable',
      'localBubble',
    ]),
    ...mapState(useUsersStore, ['currentUser']),
    pinnedList() {
      if (!this.currentUser) {
        return filterNavigation(
          [
            { ...TIMELINES.public, name: 'public' },
            { ...TIMELINES.twkn, name: 'twkn' },
            { ...ROOT_ITEMS.about, name: 'about' },
          ],
          {
            hasChats: this.pleromaChatMessagesAvailable,
            hasAnnouncements: this.supportsAnnouncements,
            isFederating: this.federating,
            isPrivate: this.privateMode,
            currentUser: this.currentUser,
            supportsBubbleTimeline: this.localBubble,
            supportsBookmarkFolders: this.bookmarks,
          },
        )
      }
      return filterNavigation(
        [
          ...Object.entries({ ...TIMELINES })
            .filter(([k]) => this.pinnedItems.has(k))
            .map(([k, v]) => ({ ...v, name: k })),
          ...this.lists.filter((k) => this.pinnedItems.has(k.name)),
          ...this.bookmarks.filter((k) => this.pinnedItems.has(k.name)),
          ...Object.entries({ ...ROOT_ITEMS })
            .filter(([k]) => this.pinnedItems.has(k))
            .map(([k, v]) => ({ ...v, name: k })),
        ],
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          supportsBubbleTimeline: this.localBubble,
          supportsBookmarkFolders: this.bookmarks,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser,
        },
      ).slice(0, this.limit)
    },
  },
}

export default NavPanel
