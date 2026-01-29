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
    ...mapStores(useOAuthStore),
    ...mapState(useOAuthStore, ['clientId','clientSecret']),
    ...mapState(useAuthFlowStore, ['settings']),
    ...mapState(useInstanceStore, ['server']),
  },
  methods: {
    ...mapActions(useAuthFlowStore, ['requireTOTP', 'abortMFA', 'login']),
    clearError() {
      this.error = false
    },

    focusOnCodeInput() {
      const codeInput = this.$refs.codeInput
      codeInput.focus()
      codeInput.setSelectionRange(0, codeInput.value.length)
    },

    submit() {
      const data = {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        instance: this.server,
        mfaToken: this.settings.mfa_token,
        code: this.code,
      }

      mfaApi.verifyRecoveryCode(data).then((result) => {
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
