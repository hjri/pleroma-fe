import { isEqual, map, uniqBy } from 'lodash-es'

import Conversation from 'src/components/conversation/conversation.vue'
import FollowCard from 'src/components/follow_card/follow_card.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'
import UserSelectorInput from 'src/components/user_selector_input/user_selector_input.vue'

import { useSearchStore } from 'src/stores/search.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faChevronDown,
  faChevronUp,
  faCircleNotch,
  faSearch,
} from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch, faSearch, faChevronDown, faChevronUp)

const Search = {
  components: {
    FollowCard,
    Conversation,
    UserSelectorInput,
    TabSwitcher,
  },
  props: ['query', 'author'],
  data() {
    return {
      loaded: false,
      loading: false,
      advancedMode: false,
      searchTerm: this.query || '',
      searchAuthor: this.author || '',
      userIds: [],
      statuses: [],
      hashtags: [],
      currenResultTab: 'statuses',

      statusesOffset: 0,
      lastStatusFetchCount: 0,
      lastSearchParams: {
        query: '',
        author: '',
      },
    }
  },
  computed: {
    searchParams() {
      return {
        query: this.query,
        author: this.author,
      }
    },
    users() {
      return this.userIds.map((userId) => useUsersStore().findUser(userId))
    },
    visibleStatuses() {
      const allStatuses = useStatusesStore().allStatuses

      return this.statuses.filter(
        (status) =>
          allStatuses.has(status.id) && !allStatuses.get(status.id).deleted,
      )
    },
  },
  mounted() {
    this.searchCurrent()
  },
  watch: {
    query(newValue) {
      this.searchTerm = newValue
      this.searchCurrent()
    },
    author(newValue) {
      this.searchAuthor = newValue
      this.searchCurrent()
    },
  },
  methods: {
    toogleAdvanced() {
      this.advancedMode = !this.advancedMode
    },
    updateToQuery() {
      this.newQuery(this.searchTerm, this.searchAuthor)
    },
    newQuery(query, author) {
      this.$router.push({ name: 'search', query: { query, author } })
      this.$refs.searchInput.focus()
    },
    searchCurrent() {
      this.search(this.searchParams)
    },
    search(params, searchType = null) {
      const { query, author } = params
      if (!query && !author) {
        this.loading = false
        return
      }

      this.loading = true
      this.$refs.searchInput.blur()
      if (!isEqual(this.lastSearchParams, params)) {
        this.userIds = []
        this.hashtags = []
        this.statuses = []

        this.statusesOffset = 0
        this.lastStatusFetchCount = 0
      }

      const searchParams = {
        q: query,
        resolve: true,
        offset: this.statusesOffset,
        type: searchType,
      }
      if (author) {
        searchParams.accountId = author
      }
      useSearchStore()
        .search(searchParams)
        .then((data) => {
          this.loading = false

          const oldLength = this.statuses.length

          // Always append to old results. If new results are empty, this doesn't change anything
          this.userIds = this.userIds.concat(map(data.accounts, 'id'))
          this.statuses = uniqBy(this.statuses.concat(data.statuses), 'id')
          this.hashtags = this.hashtags.concat(data.hashtags)

          this.currenResultTab = this.getActiveTab()
          this.loaded = true

          // Offset from whatever we already have
          this.statusesOffset = this.statuses.length
          // Because the amount of new statuses can actually be zero, compare to old lenght instead
          this.lastStatusFetchCount = this.statuses.length - oldLength
          this.lastSearchParams = { ...params }
        })
    },
    resultCount(tabName) {
      const length = this[tabName].length
      return length === 0 ? '' : ` (${length})`
    },
    onResultTabSwitch(key) {
      this.currenResultTab = key
    },
    getActiveTab() {
      if (this.visibleStatuses.length > 0) {
        return 'statuses'
      } else if (this.users.length > 0) {
        return 'people'
      } else if (this.hashtags.length > 0) {
        return 'hashtags'
      }

      return 'statuses'
    },
    lastHistoryRecord(hashtag) {
      return hashtag.history?.[0]
    },
  },
}

export default Search
