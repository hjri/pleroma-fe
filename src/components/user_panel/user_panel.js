import { mapState } from 'pinia'

import AuthForm from 'src/components/auth_form/auth_form.js'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import UserCard from 'src/components/user_card/user_card.vue'

import { useUsersStore } from 'src/stores/users.js'

const UserPanel = {
  computed: {
    ...mapState(useUsersStore, ['currentUser', 'loggedIn']),
  },
  components: {
    PostStatusForm,
    UserCard,
    AuthForm,
  },
}

export default UserPanel
