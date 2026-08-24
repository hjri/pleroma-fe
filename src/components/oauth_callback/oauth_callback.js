import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { getToken } from 'src/api/oauth.js'

const oac = {
  props: ['code'],
  mounted() {
    if (this.code) {
      const oauthStore = useOAuthStore()
      const { clientId, clientSecret } = oauthStore

      getToken({
        clientId,
        clientSecret,
        instance: useInstanceStore().server,
        code: this.code,
      }).then(async ({ data: result }) => {
        oauthStore.setToken(result.access_token)

        await useUsersStore().loginUser(result.access_token)
        this.$router.push({ name: 'friends' })
      })
    }
  },
}

export default oac
