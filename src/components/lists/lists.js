import ListsCard from '../lists_card/lists_card.vue'

import { useListsStore } from 'src/stores/lists.js'

const Lists = {
  data() {
    return {
      isNew: false,
    }
  },
  components: {
    ListsCard,
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
