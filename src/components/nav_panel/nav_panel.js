import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import BookmarkFoldersMenuContent from 'src/components/bookmark_folders_menu/bookmark_folders_menu_content.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import ListsMenuContent from 'src/components/lists_menu/lists_menu_content.vue'
import { filterNavigation } from 'src/components/navigation/filter.js'
import { ROOT_ITEMS, TIMELINES } from 'src/components/navigation/navigation.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import NavigationPins from 'src/components/navigation/navigation_pins.vue'

import { useAnnouncementsStore } from 'src/stores/announcements'
import { useChatsStore } from 'src/stores/chats.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBookmark,
  faBullhorn,
  faChevronDown,
  faChevronUp,
  faCity,
  faComments,
  faEnvelope,
  faFilePen,
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
  faChevronDown,
  faChevronUp,
  faComments,
  faBell,
  faInfoCircle,
  faStream,
  faList,
  faBullhorn,
  faFilePen,
)
const NavPanel = {
  props: ['forceExpand', 'forceEditMode'],
  components: {
    BookmarkFoldersMenuContent,
    ListsMenuContent,
    NavigationEntry,
    NavigationPins,
    Checkbox,
  },
  data() {
    return {
      editMode: false,
      showTimelines: false,
      showLists: false,
      showBookmarkFolders: false,
      timelinesList: Object.entries(TIMELINES).map(([k, v]) => ({
        ...v,
        name: k,
      })),
      rootList: Object.entries(ROOT_ITEMS).map(([k, v]) => ({ ...v, name: k })),
    }
  },
  methods: {
    toggleTimelines() {
      this.showTimelines = !this.showTimelines
    },
    toggleLists() {
      this.showLists = !this.showLists
    },
    toggleBookmarkFolders() {
      this.showBookmarkFolders = !this.showBookmarkFolders
    },
    toggleEditMode() {
      this.editMode = !this.editMode
    },
    toggleCollapse() {
      useSyncConfigStore().setSimplePrefAndSave({
        path: 'collapseNav',
        value: !this.collapsed,
      })
      useSyncConfigStore().pushSyncConfig()
    },
    isPinned(item) {
      return this.pinnedItems.has(item)
    },
    togglePin(item) {
      if (this.isPinned(item)) {
        useSyncConfigStore().removeCollectionPreference({
          path: 'collections.pinnedNavItems',
          value: item,
        })
      } else {
        useSyncConfigStore().addCollectionPreference({
          path: 'collections.pinnedNavItems',
          value: item,
        })
      }
      useSyncConfigStore().pushSyncConfig()
    },
  },
  computed: {
    ...mapPiniaState(useAnnouncementsStore, {
      unreadAnnouncementCount: 'unreadAnnouncementCount',
      supportsAnnouncements: (store) => store.supportsAnnouncements,
    }),
    ...mapPiniaState(useInstanceCapabilitiesStore, [
      'pleromaChatMessagesAvailable',
      'pleromaBookmarkFoldersAvailable',
      'localBubble',
    ]),
    ...mapPiniaState(useInstanceStore, ['federating']),
    ...mapPiniaState(useInstanceStore, {
      privateMode: (store) => store.private,
    }),
    ...mapPiniaState(useSyncConfigStore, {
      collapsed: (store) => store.prefsStorage.simple.collapseNav,
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems),
    }),
    ...mapPiniaState(useUsersStore, ['currentUser']),
    ...mapState({
      followRequestCount: (state) => state.api.followRequests.length,
    }),
    ...mapPiniaState(useChatsStore, ['unreadChatsCount']),
    timelinesItems() {
      return filterNavigation(
        Object.entries({ ...TIMELINES })
          // do not show in timeliens list since it's in a better place now
          .filter(([key]) => key !== 'bookmarks')
          .map(([k, v]) => ({ ...v, name: k })),
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser,
          supportsBubbleTimeline: this.localBubble,
          supportsBookmarkFolders: this.pleromaBookmarkFoldersAvailable,
        },
      )
    },
    rootItems() {
      return filterNavigation(
        Object.entries({ ...ROOT_ITEMS }).map(([k, v]) => ({ ...v, name: k })),
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser,
          supportsBubbleTimeline: this.localBubble,
          supportsBookmarkFolders: this.pleromaBookmarkFoldersAvailable,
        },
      )
    },
  },
}

export default NavPanel
