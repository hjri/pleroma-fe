import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import { getListEntries } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'

import { useListsStore } from 'src/stores/lists.js'

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
    }),
  },
}

export default ListsMenuContent
