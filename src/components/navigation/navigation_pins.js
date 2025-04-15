import { mapState } from 'vuex'
import { mapState as mapPiniaState } from 'pinia'
import { TIMELINES, ROOT_ITEMS, routeTo } from 'src/components/navigation/navigation.js'
import { getBookmarkFolderEntries, getListEntries, filterNavigation } from 'src/components/navigation/filter.js'

import StillImage from 'src/components/still-image/still-image.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faUsers,
  faGlobe,
  faBookmark,
  faEnvelope,
  faComments,
  faBell,
  faInfoCircle,
  faStream,
  faList
} from '@fortawesome/free-solid-svg-icons'
import { useListsStore } from 'src/stores/lists'
import { useAnnouncementsStore } from 'src/stores/announcements'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

library.add(
  faUsers,
  faGlobe,
  faBookmark,
  faEnvelope,
  faComments,
  faBell,
  faInfoCircle,
  faStream,
  faList
)

const NavPanel = {
  props: ['limit'],
  methods: {
    getRouteTo (item) {
      return routeTo(item, this.currentUser)
    }
  },
  components: {
    StillImage
  },
  computed: {
    getters () {
      return this.$store.getters
    },
    ...mapPiniaState(useListsStore, {
      lists: getListEntries
    }),
    ...mapPiniaState(useAnnouncementsStore, {
      supportsAnnouncements: store => store.supportsAnnouncements
    }),
    ...mapPiniaState(useBookmarkFoldersStore, {
      bookmarks: getBookmarkFolderEntries,
    }),
    ...mapPiniaState(useServerSideStorageStore, {
      pinnedItems: store => new Set(store.prefsStorage.collections.pinnedNavItems)
    }),
    ...mapState({
      currentUser: state => state.users.currentUser,
      followRequestCount: state => state.api.followRequests.length,
      privateMode: state => state.instance.private,
      federating: state => state.instance.federating,
      pleromaChatMessagesAvailable: state => state.instance.pleromaChatMessagesAvailable
    }),
    pinnedList () {
      if (!this.currentUser) {
        return filterNavigation([
          { ...TIMELINES.public, name: 'public' },
          { ...TIMELINES.twkn, name: 'twkn' },
          { ...ROOT_ITEMS.about, name: 'about' }
        ],
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser
        })
      }
      return filterNavigation(
        [
          ...Object
            .entries({ ...TIMELINES })
            .filter(([k]) => this.pinnedItems.has(k))
            .map(([k, v]) => ({ ...v, name: k })),
          ...this.lists.filter((k) => this.pinnedItems.has(k.name)),
          ...this.bookmarks.filter((k) => this.pinnedItems.has(k.name)),
          ...Object
            .entries({ ...ROOT_ITEMS })
            .filter(([k]) => this.pinnedItems.has(k))
            .map(([k, v]) => ({ ...v, name: k }))
        ],
        {
          hasChats: this.pleromaChatMessagesAvailable,
          hasAnnouncements: this.supportsAnnouncements,
          isFederating: this.federating,
          isPrivate: this.privateMode,
          currentUser: this.currentUser
        }
      ).slice(0, this.limit)
    }
  }
}

export default NavPanel
