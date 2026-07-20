import FolderCard from 'src/components/folder_card/folder_card.vue'

import { useListsStore } from 'src/stores/lists.js'

const Lists = {
  data() {
    return {
      isNew: false,
    }
  },
  components: {
    FolderCard,
  },
  computed: {
    lists() {
      return useListsStore().allLists
    },
  },
  methods: {
    cancelNewList() {
      this.isNew = false
    },
    newList() {
      this.isNew = true
    },
  },
}

export default Lists
