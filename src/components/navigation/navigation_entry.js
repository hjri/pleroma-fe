import { mapState } from 'vuex'
import { routeTo } from 'src/components/navigation/navigation.js'
import OptionalRouterLink from 'src/components/optional_router_link/optional_router_link.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faThumbtack } from '@fortawesome/free-solid-svg-icons'
import { mapStores, mapState as mapPiniaState } from 'pinia'

import { useAnnouncementsStore } from 'src/stores/announcements'
import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

library.add(faThumbtack)

const NavigationEntry = {
  props: ['item', 'showPin'],
  components: {
    OptionalRouterLink
  },
  methods: {
    isPinned (value) {
      return this.pinnedItems.has(value)
    },
    togglePin (value) {
      if (this.isPinned(value)) {
        useServerSideStorageStore().removeCollectionPreference({ path: 'collections.pinnedNavItems', value })
      } else {
        useServerSideStorageStore().addCollectionPreference({ path: 'collections.pinnedNavItems', value })
      }
      useServerSideStorageStore().pushServerSideStorage()
    }
  },
  computed: {
    routeTo () {
      return routeTo(this.item, this.currentUser)
    },
    getters () {
      return this.$store.getters
    },
    ...mapStores(useAnnouncementsStore),
    ...mapState({
      currentUser: state => state.users.currentUser
    }),
    ...mapPiniaState(useServerSideStorageStore, {
      pinnedItems: store => new Set(store.prefsStorage.collections.pinnedNavItems)
    }),
  }
}

export default NavigationEntry
