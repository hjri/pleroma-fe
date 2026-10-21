import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchUser } from 'src/api/public.js'

const RemoteUserResolver = {
  data: () => ({
    error: false,
  }),
  mounted() {
    this.redirect()
  },
  methods: {
    redirect() {
      const id = this.$route.params.username + '@' + this.$route.params.hostname
      fetchUser({
        id,
        credentials: useOAuthStore().token,
      })
        .then((result) => {
          const { data: externalUser } = result
          useUsersStore().addNewUsers(result)
          const id = externalUser.id
          this.$router.replace({
            name: 'external-user-profile',
            params: { id },
          })
        })
        .catch(() => {
          this.error = true
        })
    },
  },
}

export default RemoteUserResolver
