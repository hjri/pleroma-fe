import { mapActions, mapState, mapStores } from 'pinia'

import { useAuthFlowStore } from 'src/stores/auth_flow.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import mfaApi from '../../services/new_api/mfa.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes)

export default {
  data: () => ({
    code: null,
    error: false,
  }),
  computed: {
    ...mapState(useAuthFlowStore, {
      authSettings: (store) => store.settings,
    }),
    ...mapState(useInstanceStore, ['server']),
    ...mapStores(useOAuthStore),
  },
  methods: {
    ...mapActions(useAuthFlowStore, ['requireRecovery', 'abortMFA', 'login']),
    clearError() {
      this.error = false
    },

    focusOnCodeInput() {
      const codeInput = this.$refs.codeInput
      codeInput.focus()
      codeInput.setSelectionRange(0, codeInput.value.length)
    },

    submit() {
      const { clientId, clientSecret } = this.oauthStore

      const data = {
        clientId,
        clientSecret,
        instance: this.server,
        mfaToken: this.authSettings.mfa_token,
        code: this.code,
      }

      mfaApi.verifyOTPCode(data).then((result) => {
        if (result.error) {
          this.error = result.error
          this.code = null
          this.focusOnCodeInput()
          return
        }

        this.login(result).then(() => {
          this.$router.push({ name: 'friends' })
        })
      })
    },
  },
}
