import FollowCard from 'src/components/follow_card/follow_card.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchUser, suggestions } from 'src/services/api/api.service.js'

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
        }).then((externalUser) => {
          if (!externalUser.error) {
            this.$store.commit('addNewUsers', [externalUser])
            this.users.push(externalUser)
          }
        })
      })
    },
    getWhoToFollow() {
      const credentials = useOAuthStore().token
      if (credentials) {
        suggestions({ credentials }).then((reply) => {
          this.showWhoToFollow(reply)
        })
      }
    },
  },
}

export default WhoToFollow
