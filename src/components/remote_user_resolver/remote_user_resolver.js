import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchUser } from 'src/services/api/public.js'

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
        .then((externalUser) => {
          if (externalUser.error) {
            this.error = true
          } else {
            this.$store.commit('addNewUsers', [externalUser])
            const id = externalUser.id
            this.$router.replace({
              name: 'external-user-profile',
              params: { id },
            })
          }
        })
        .catch(() => {
          this.error = true
        })
    },
  },
}

export default RemoteUserResolver
