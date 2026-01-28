import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import { getListEntries } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import { useInstanceStore } from 'src/stores/instance.js'
import { useListsStore } from 'src/stores/lists'

export const ListsMenuContent = {
  props: ['showPin'],
  components: {
    NavigationEntry,
  },
  computed: {
    ...mapPiniaState(useListsStore, {
      lists: getListEntries,
    }),
    ...mapState({
      currentUser: (state) => state.users.currentUser,
      privateMode: (state) => useInstanceStore().private,
      federating: (state) => useInstanceStore().federating,
    }),
  },
}

export default ListsMenuContent
