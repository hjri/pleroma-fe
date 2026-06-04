import { mapState } from 'pinia'

import Popover from '../popover/popover.vue'

import { useListsStore } from 'src/stores/lists.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronRight)

const UserListMenu = {
  props: ['user'],
  data() {
    return {}
  },
  components: {
    Popover,
  },
  created() {
    this.$store.dispatch('fetchUserInLists', this.user.id)
  },
  computed: {
    ...mapState(useListsStore, {
      allLists: (store) => store.allLists,
    }),
    inListsSet() {
      return new Set(this.user.inLists.map((x) => x.id))
    },
    lists() {
      if (!this.user.inLists) return []
      return this.allLists.map((list) => ({
        ...list,
        inList: this.inListsSet.has(list.id),
      }))
    },
    triggerAttrs() {
      return {
        class: 'menu-item dropdown-item -has-submenu',
      }
    },
  },
  methods: {
    toggleList(listId) {
      if (this.inListsSet.has(listId)) {
        useListsStore()
          .removeListAccount({ accountId: this.user.id, listId })
          .then((response) => {
            if (!response.ok) {
              return
            }
            this.$store.dispatch('fetchUserInLists', this.user.id)
          })
      } else {
        useListsStore()
          .addListAccount({ accountId: this.user.id, listId })
          .then((response) => {
            if (!response.ok) {
              return
            }
            this.$store.dispatch('fetchUserInLists', this.user.id)
          })
      }
    },
  },
}

export default UserListMenu
