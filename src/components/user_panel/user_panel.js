import { defineAsyncComponent } from 'vue'
import { mapState } from 'vuex'

import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import UserCard from 'src/components/user_card/user_card.vue'

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
    PostStatusForm,
    UserCard,
  },
}

export default UserPanel
