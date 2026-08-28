import FollowCard from 'src/components/follow_card/follow_card.vue'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchUser, suggestions } from 'src/api/public.js'

const WhoToFollow = {
  components: {
    FollowCard,
  },
  data() {
    return {
      users: [],
    }
  },
  mounted() {
    this.getWhoToFollow()
  },
  methods: {
    showWhoToFollow(reply) {
      reply.forEach(({ id }) => {
        fetchUser({
          id,
          credentials: useOAuthStore().token,
        }).then((result) => {
          const [user] = useUsersStore().addNewUsers(result)

          this.users.push(user)
        })
      })
    },
    getWhoToFollow() {
      const credentials = useOAuthStore().token
      if (credentials) {
        suggestions({ credentials }).then(({ data: reply }) => {
          this.showWhoToFollow(reply)
        })
      }
    },
  },
}

export default WhoToFollow
