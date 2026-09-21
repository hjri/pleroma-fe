import { mapActions, mapState } from 'pinia'

import { useAuthFlowStore } from 'src/stores/auth_flow.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { getLoginUrl, getTokenWithCredentials } from 'src/api/oauth.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes)

const LoginForm = {
  data: () => ({
    user: {},
    error: false,
  }),
  computed: {
    ...mapState(useUsersStore, ['loggingIn']),
    ...mapState(useOAuthStore, ['clientId', 'clientSecret']),
    ...mapState(useInstanceStore, ['server', 'registrationOpen']),
    ...mapState(useAuthFlowStore, {
      isTokenAuth: (store) => store.requiredToken,
      isPasswordAuth: (store) => !store.requiredToken,
    }),
  },
  methods: {
    ...mapActions(useAuthFlowStore, ['requireMFA', 'login']),
    ...mapActions(useOAuthStore, ['ensureAppToken']),
    submit() {
      this.isTokenAuth ? this.submitToken() : this.submitPassword()
    },
    submitToken() {
      // NOTE: we do not really need the app token, but obtaining a token and
      // calling verify_credentials is the only way to ensure the app still works.
      this.ensureAppToken().then(() => {
        window.location.href = getLoginUrl({
          clientId: this.clientId,
          instance: this.server,
        })
      })
    },
    submitPassword() {
      this.error = false

      // NOTE: we do not really need the app token, but obtaining a token and
      // calling verify_credentials is the only way to ensure the app still works.
      this.ensureAppToken().then(() => {
        getTokenWithCredentials({
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          instance: this.server,
          username: this.user.username,
          password: this.user.password,
        })
          .then(({ data: result }) => {
            this.login(result).then(() => {
              this.$router.push({ name: 'friends' })
            })
          })
          .catch((error) => {
            if (error.errorData === 'mfa_required') {
              this.requireMFA({ settings: error.error })
            } else if (error.identifier === 'password_reset_required') {
              this.$router.push({
                name: 'password-reset',
                params: { passwordResetRequested: true },
              })
            } else {
              this.error = error
              this.focusOnPasswordInput()
            }
          })
      })
    },
    clearError() {
      this.error = false
    },
    focusOnPasswordInput() {
      const passwordInput = this.$refs.passwordInput
      passwordInput.focus()
      passwordInput.setSelectionRange(0, passwordInput.value.length)
    },
  },
}

export default LoginForm
