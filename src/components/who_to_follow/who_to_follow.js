import FollowCard from 'src/components/follow_card/follow_card.vue'
import apiService from '../../services/api/api.service.js'

import { useCredentialsStore } from 'src/stores/credentials.js'
import { useInstanceStore } from 'src/stores/instance.js'

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
          credentials: useCredentialsStore().current,
        }).then((externalUser) => {
          if (!externalUser.error) {
            this.$store.commit('addNewUsers', [externalUser])
            this.users.push(externalUser)
          }
        })
      })
    },
    getWhoToFollow() {
      const credentials = useCredentialsStore().current
      if (credentials) {
        suggestions({ credentials }).then((reply) => {
          this.showWhoToFollow(reply)
        })
      }
    },
  },
}

export default WhoToFollow
