import { mapActions, mapState as mapPiniaState, mapStores } from 'pinia'
import { mapState } from 'vuex'

import { useAuthFlowStore } from 'src/stores/auth_flow.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import oauthApi from '../../services/new_api/oauth.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes)

const LoginForm = {
  data: () => ({
    user: {},
    error: false,
  }),
  computed: {
    ...mapState(useInstanceStore, ['server'])
    ...mapStores(useOAuthStore),
    ...mapState({
      registrationOpen: (state) => useInstanceStore().registrationOpen,
      loggingIn: (state) => state.users.loggingIn,
    }),
    ...mapPiniaState(useAuthFlowStore, {
      isTokenAuth: (store) => store.requiredToken,
      isPasswordAuth: (store) => !store.requiredToken,
    }),
  },
  methods: {
    ...mapActions(useAuthFlowStore, ['requireMFA', 'login']),
    submit() {
      this.isTokenAuth ? this.submitToken() : this.submitPassword()
    },
    submitToken() {
      const data = {
        instance: this.server,
        commit: this.$store.commit,
      }

      // NOTE: we do not really need the app token, but obtaining a token and
      // calling verify_credentials is the only way to ensure the app still works.
      this.oauthStore.ensureAppToken().then(() => {
        const app = {
          clientId: this.oauthStore.clientId,
          clientSecret: this.oauthStore.clientSecret,
        }
        oauthApi.login({ ...app, ...data })
      })
    },
    submitPassword() {
      this.error = false

      // NOTE: we do not really need the app token, but obtaining a token and
      // calling verify_credentials is the only way to ensure the app still works.
      this.oauthStore.ensureAppToken().then(() => {
        const app = {
          clientId: this.oauthStore.clientId,
          clientSecret: this.oauthStore.clientSecret,
        }

        oauthApi
          .getTokenWithCredentials({
            ...app,
            instance: this.server,
            username: this.user.username,
            password: this.user.password,
          })
          .then((result) => {
            if (result.error) {
              if (result.error === 'mfa_required') {
                this.requireMFA({ settings: result })
              } else if (result.identifier === 'password_reset_required') {
                this.$router.push({
                  name: 'password-reset',
                  params: { passwordResetRequested: true },
                })
              } else {
                this.error = result.error
                this.focusOnPasswordInput()
              }
              return
            }
            this.login(result).then(() => {
              this.$router.push({ name: 'friends' })
            })
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
