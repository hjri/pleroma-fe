import { mapState as mapPiniaState } from 'pinia'
import { getListEntries } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import { useListsStore } from 'src/stores/lists'
import { mapState } from 'vuex'

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
      privateMode: (state) => state.instance.private,
      federating: (state) => state.instance.federating,
    }),
  },
}

export default ListsMenuContent
