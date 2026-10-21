import { mapState } from 'pinia'

import { getListEntries } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'

import { useListsStore } from 'src/stores/lists.js'
import { useUsersStore } from 'src/stores/users.js'

export const ListsMenuContent = {
  props: ['showPin'],
  components: {
    NavigationEntry,
  },
  computed: {
    ...mapState(useListsStore, {
      lists: getListEntries,
    }),
    ...mapState(useUsersStore, ['currentUser']),
  },
}

export default ListsMenuContent
