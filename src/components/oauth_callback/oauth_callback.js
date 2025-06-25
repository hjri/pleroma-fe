import oauth from '../../services/new_api/oauth.js'
import { useOAuthStore } from 'src/stores/oauth.js'

const oac = {
  props: ['code'],
  mounted () {
    if (this.code) {
      const oauthStore = useOAuthStore()
      const { clientId, clientSecret } = oauthStore

      oauth.getToken({
        clientId,
        clientSecret,
        instance: this.$store.state.instance.server,
        code: this.code
      }).then((result) => {
        oauthStore.setToken(result.access_token)
        this.$store.dispatch('loginUser', result.access_token)
        this.$router.push({ name: 'friends' })
      })
    }
  }
}

export default oac
