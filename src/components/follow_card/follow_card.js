import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import FollowButton from 'src/components/follow_button/follow_button.vue'
import RemoteFollow from 'src/components/remote_follow/remote_follow.vue'
import RemoveFollowerButton from 'src/components/remove_follower_button/remove_follower_button.vue'

const FollowCard = {
  props: ['user', 'noFollowsYou'],
  components: {
    BasicUserCard,
    RemoteFollow,
    FollowButton,
    RemoveFollowerButton,
  },
  computed: {
    isMe() {
      return this.$store.state.users.currentUser.id === this.user.id
    },
    loggedIn() {
      return this.$store.state.users.currentUser
    },
    relationship() {
      return this.$store.getters.relationship(this.user.id)
    },
  },
}

export default FollowCard
