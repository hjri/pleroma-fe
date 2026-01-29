import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

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
import StillImage from 'src/components/still-image/still-image.vue'

import { useAnnouncementsStore } from 'src/stores/announcements'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders'
import { useInstanceStore } from 'src/stores/instance.js'
import { useListsStore } from 'src/stores/lists'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

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
  components: {
    StillImage,
  },
  computed: {
    getters() {
      return this.$store.getters
    },
    ...mapPiniaState(useListsStore, {
      lists: getListEntries,
    }),
    ...mapPiniaState(useAnnouncementsStore, {
      supportsAnnouncements: (store) => store.supportsAnnouncements,
    }),
    ...mapPiniaState(useBookmarkFoldersStore, {
      bookmarks: getBookmarkFolderEntries,
    }),
    ...mapPiniaState(useServerSideStorageStore, {
      pinnedItems: (store) =>
        new Set(store.prefsStorage.collections.pinnedNavItems),
    }),
    ...mapPiniaState(useInstanceStore, {
      pleromaChatMessagesAvailable: (store) =>
        store.featureSet.pleromaChatMessagesAvailable,
      bubbleTimeline: (store) => store.featureSet.localBubble,
    }),
    ...mapPiniaState(useInstanceStore, ['private', 'federating']),
    ...mapState({
      currentUser: (state) => state.users.currentUser,
      followRequestCount: (state) => state.api.followRequests.length,
    }),
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
            isPrivate: this.private,
            currentUser: this.currentUser,
            supportsBubbleTimeline: this.bubbleTimeline,
            supportsBookmarkFolders: this.bookmarks,
          },
        )
      }
      console.log([...this.pinnedItems])
      console.log([...this.bookmarks])
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
          supportsBubbleTimeline: this.bubbleTimeline,
          supportsBookmarkFolders: this.bookmarks,
          isFederating: this.federating,
          isPrivate: this.private,
          currentUser: this.currentUser,
        },
      ).slice(0, this.limit)
    },
  },
}

export default NavPanel
