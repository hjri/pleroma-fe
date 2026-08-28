import { debounce } from 'lodash'

import Checkbox from 'src/components/checkbox/checkbox.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronLeft, faSearch } from '@fortawesome/free-solid-svg-icons'
import { useSearchStore } from 'src/stores/search.js'

library.add(faSearch, faChevronLeft)

const ListsUserSearch = {
  components: {
    Checkbox,
  },
  emits: ['loading', 'loadingDone', 'results'],
  data() {
    return {
      loading: false,
      query: '',
      followingOnly: true,
    }
  },
  methods: {
    onInput: debounce(function () {
      this.search(this.query)
    }, 2000),
    search(query) {
      if (!query) {
        this.loading = false
        return
      }

      this.loading = true
      this.$emit('loading')
      this.userIds = []
      useSearchStore()
        .search({
          q: query,
          resolve: true,
          type: 'accounts',
          following: this.followingOnly,
        })
        .then((data) => {
          this.$emit(
            'results',
            data.accounts.map((a) => a.id),
          )
        })
        .finally(() => {
          this.loading = false
          this.$emit('loadingDone')
        })
    },
  },
}

export default ListsUserSearch
