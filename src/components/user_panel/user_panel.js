import { defineAsyncComponent } from 'vue'
import { mapState } from 'vuex'

const UserPanel = {
  computed: {
    signedIn() {
      return this.user
    },
    ...mapState({ user: (state) => state.users.currentUser }),
  },
  components: {
    AuthForm: defineAsyncComponent(
      () => import('src/components/auth_form/auth_form.js'),
    ),
    PostStatusForm: defineAsyncComponent(
      () => import('src/components/post_status_form/post_status_form.vue'),
    ),
    UserCard: defineAsyncComponent(
      () => import('src/components/user_card/user_card.vue'),
    ),
  },
}

export default UserPanel
