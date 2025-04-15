import BookmarkFoldersMenuContent from 'src/components/bookmark_folders_menu/bookmark_folders_menu_content.vue'
import ListsMenuContent from 'src/components/lists_menu/lists_menu_content.vue'
import { mapState, mapGetters } from 'vuex'
import { mapState as mapPiniaState } from 'pinia'
import { TIMELINES, ROOT_ITEMS } from 'src/components/navigation/navigation.js'
import { filterNavigation } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import NavigationPins from 'src/components/navigation/navigation_pins.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'

import { useAnnouncementsStore } from 'src/stores/announcements'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faUsers,
  faGlobe,
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
  faFilePen
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faUsers,
  faGlobe,
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
  faFilePen
)
const NavPanel = {
  props: ['forceExpand', 'forceEditMode'],
  created () {
  },
  components: {
    BookmarkFoldersMenuContent,
    ListsMenuContent,
    NavigationEntry,
    NavigationPins,
    Checkbox
  },
  data () {
    return {
      editMode: false,
      showTimelines: false,
      showLists: false,
      showBookmarkFolders: false,
      timelinesList: Object.entries(TIMELINES).map(([k, v]) => ({ ...v, name: k })),
      rootList: Object.entries(ROOT_ITEMS).map(([k, v]) => ({ ...v, name: k }))
    }
  },
  methods: {
    toggleTimelines () {
      this.showTimelines = !this.showTimelines
    },
    toggleLists () {
      this.showLists = !this.showLists
    },
    toggleBookmarkFolders () {
      this.showBookmarkFolders = !this.showBookmarkFolders
    },
    toggleEditMode () {
      this.editMode = !this.editMode
    },
    toggleCollapse () {
      useServerSideStorageStore().setPreference({ path: 'simple.collapseNav', value: !this.collapsed })
      useServerSideStorageStore().pushServerSideStorage()
    },
    isPinned (item) {
      return this.pinnedItems.has(item)
    },
    togglePin (item) {
      if (this.isPinned(item)) {
        useServerSideStorageStore().removeCollectionPreference({ path: 'collections.pinnedNavItems', value: item })
      } else {
        useServerSideStorageStore().addCollectionPreference({ path: 'collections.pinnedNavItems', value: item })
      }
      useServerSideStorageStore().pushServerSideStorage()
    }
  },
  computed: {
    ...mapPiniaState(useAnnouncementsStore, {
      unreadAnnouncementCount: 'unreadAnnouncementCount',
      supportsAnnouncements: store => store.supportsAnnouncements
    }),
    ...mapPiniaState(useServerSideStorageStore, {
      collapsed: store => store.prefsStorage.simple.collapseNav,
      pinnedItems: store => new Set(store.prefsStorage.collections.pinnedNavItems)
    }),
    ...mapState({
      currentUser: state => state.users.currentUser,
      followRequestCount: state => state.api.followRequests.length,
      privateMode: state => state.instance.private,
      federating: state => state.instance.federating,
      pleromaChatMessagesAvailable: state => state.instance.pleromaChatMessagesAvailable,
      bookmarkFolders: state => state.instance.pleromaBookmarkFoldersAvailable
    }),
    timelinesItems () {
      return filterNavigation(
        Object
          .entries({ ...TIMELINES })
          .map(([k, v]) => ({ ...v, name: k })),
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser,
          supportsBookmarkFolders: this.bookmarkFolders
        }
      )
    },
    rootItems () {
      return filterNavigation(
        Object
          .entries({ ...ROOT_ITEMS })
          .map(([k, v]) => ({ ...v, name: k })),
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser,
          supportsBookmarkFolders: this.bookmarkFolders
        }
      )
    },
    ...mapGetters(['unreadChatCount'])
  }
}

export default NavPanel
