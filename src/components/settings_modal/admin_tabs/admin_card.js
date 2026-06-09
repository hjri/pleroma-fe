import { defineAsyncComponent } from 'vue'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'

import { useAdminUsersStore } from 'src/stores/adminUsers.js'

const AdminCard = {
  props: {
    userId: {
      type: String,
    },
  },
  components: {
    BasicUserCard,
    ModerationTools: defineAsyncComponent(
      () => import('src/components/moderation_tools/moderation_tools.vue'),
    ),
  },
  computed: {
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    userAdminData() {
      return useAdminUsersStore().getUser(this.userId)
    },
    relationship() {
      return this.$store.getters.relationship(this.userId)
    },
    isLocal() {
      return this.user.is_local
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
    isApproved() {
      return this.userAdminData.is_approved
    },
    isConfirmed() {
      return this.userAdminData.is_confirmed
    },
  },
}

export default AdminCard
