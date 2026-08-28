import { mapState } from 'pinia'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useSearchStore } from 'src/stores/search.js'
import { useUsersStore } from 'src/stores/users.js'

import { chats } from 'src/api/chats.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronLeft, faSearch } from '@fortawesome/free-solid-svg-icons'

library.add(faSearch, faChevronLeft)

const chatNew = {
  components: {
    BasicUserCard,
    UserAvatar,
  },
  data() {
    return {
      suggestions: [],
      userIds: [],
      loading: false,
      query: '',
    }
  },
  async created() {
    const { data } = await chats({
      credentials: useOAuthStore().token,
    })
    data.forEach((chat) => this.suggestions.push(chat.account))
  },
  computed: {
    users() {
      return this.userIds.map((userId) => this.findUser(userId))
    },
    availableUsers() {
      if (this.query.length !== 0) {
        return this.users
      } else {
        return this.suggestions
      }
    },
    ...mapState(useUsersStore, ['currentUser', 'findUser']),
  },
  methods: {
    goBack() {
      this.$emit('cancel')
    },
    goToChat(user) {
      this.$router.push({ name: 'chat', params: { recipient_id: user.id } })
    },
    onInput() {
      this.search(this.query)
    },
    addUser(user) {
      this.selectedUserIds.push(user.id)
      this.query = ''
    },
    removeUser(userId) {
      this.selectedUserIds = this.selectedUserIds.filter((id) => id !== userId)
    },
    search(query) {
      if (!query) {
        this.loading = false
        return
      }

      this.loading = true
      this.userIds = []
      this.$store
      useSearchStore()
        .search({ q: query, resolve: true, type: 'accounts' })
        .then((data) => {
          this.loading = false
          this.userIds = data.accounts.map((a) => a.id)
        })
    },
  },
}

export default chatNew
