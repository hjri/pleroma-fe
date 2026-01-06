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
import { mapState as mapPiniaState } from 'pinia'
import BookmarkFoldersMenuContent from 'src/components/bookmark_folders_menu/bookmark_folders_menu_content.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import ListsMenuContent from 'src/components/lists_menu/lists_menu_content.vue'
import { filterNavigation } from 'src/components/navigation/filter.js'
import { ROOT_ITEMS, TIMELINES } from 'src/components/navigation/navigation.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import NavigationPins from 'src/components/navigation/navigation_pins.vue'
import { useAnnouncementsStore } from 'src/stores/announcements'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'
import { mapGetters, mapState } from 'vuex'

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
      useServerSideStorageStore().setPreference({
        path: 'simple.collapseNav',
        value: !this.collapsed,
      })
      useServerSideStorageStore().pushServerSideStorage()
    },
    isPinned(item) {
      return this.pinnedItems.has(item)
    },
    togglePin(item) {
      if (this.isPinned(item)) {
        useServerSideStorageStore().removeCollectionPreference({
          path: 'collections.pinnedNavItems',
          value: item,
        })
      } else {
        useServerSideStorageStore().addCollectionPreference({
          path: 'collections.pinnedNavItems',
          value: item,
        })
      }
      useServerSideStorageStore().pushServerSideStorage()
    },
  },
  computed: {
    ...mapPiniaState(useAnnouncementsStore, {
      unreadAnnouncementCount: 'unreadAnnouncementCount',
      supportsAnnouncements: (store) => store.supportsAnnouncements,
    }),
    ...mapPiniaState(useServerSideStorageStore, {
      collapsed: (store) => store.prefsStorage.simple.collapseNav,
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems),
    }),
    ...mapState({
      currentUser: (state) => state.users.currentUser,
      followRequestCount: (state) => state.api.followRequests.length,
      privateMode: (state) => state.instance.private,
      federating: (state) => state.instance.federating,
      pleromaChatMessagesAvailable: (state) =>
        state.instance.pleromaChatMessagesAvailable,
      bookmarkFolders: (state) =>
        state.instance.pleromaBookmarkFoldersAvailable,
      bubbleTimeline: (state) => state.instance.localBubbleInstances.length > 0,
    }),
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
          supportsBubbleTimeline: this.bubbleTimeline,
          supportsBookmarkFolders: this.bookmarkFolders,
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
          supportsBubbleTimeline: this.bubbleTimeline,
          supportsBookmarkFolders: this.bookmarkFolders,
        },
      )
    },
    ...mapGetters(['unreadChatCount']),
  },
}

export default NavPanel
