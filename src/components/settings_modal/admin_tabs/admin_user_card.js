import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import ModerationTools from 'src/components/moderation_tools/moderation_tools.vue'

const AdminUserCard = {
  props: {
    userId: {
      type: String,
    },
  },
  components: {
    BasicUserCard,
    ModerationTools,
  },
  computed: {
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    isAdmin() {
      return this.user.rights.admin
    },
    isModerator() {
      return this.user.rights.moderator
    },
    isActivated() {
      return !this.user.deactivated
    },
  },
}

export default AdminUserCard
