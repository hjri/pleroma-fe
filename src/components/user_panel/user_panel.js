import { mapState } from 'vuex'

import AuthForm from 'src/components/auth_form/auth_form.js'
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
    PostStatusForm,
    UserCard,
    AuthForm,
  },
}

export default UserPanel
