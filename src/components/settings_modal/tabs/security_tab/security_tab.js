import Checkbox from 'src/components/checkbox/checkbox.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import Mfa from './mfa.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useOAuthTokensStore } from 'src/stores/oauth_tokens'

import {
  addAlias,
  changeEmail,
  changePassword,
  deleteAccount,
  deleteAlias,
  listAliases,
  moveAccount,
} from 'src/api/user.js'
import localeService from 'src/services/locale/locale.service.js'

const SecurityTab = {
  data() {
    return {
      newEmail: '',
      changeEmailError: false,
      changeEmailPassword: '',
      changedEmail: false,
      deletingAccount: false,
      deleteAccountConfirmPasswordInput: '',
      deleteAccountError: false,
      changePasswordInputs: ['', '', ''],
      changedPassword: false,
      changePasswordError: false,
      moveAccountTarget: '',
      moveAccountPassword: '',
      movedAccount: false,
      moveAccountError: false,
      aliases: [],
      listAliasesError: false,
      addAliasTarget: '',
      addedAlias: false,
      addAliasError: false,
    }
  },
  created() {
    useOAuthTokensStore().fetchTokens()
    this.fetchAliases()
  },
  components: {
    ProgressButton,
    Mfa,
    Checkbox,
  },
  computed: {
    user() {
      return this.$store.state.users.currentUser
    },
    pleromaExtensionsAvailable() {
      return useInstanceCapabilitiesStore().pleromaExtensionsAvailable
    },
    oauthTokens() {
      return useOAuthTokensStore().tokens.map((oauthToken) => {
        return {
          id: oauthToken.id,
          appName: oauthToken.app_name,
          validUntil: new Date(oauthToken.valid_until).toLocaleDateString(
            localeService.internalToBrowserLocale(this.$i18n.locale),
          ),
        }
      })
    },
  },
  methods: {
    confirmDelete() {
      this.deletingAccount = true
    },
    deleteAccount() {
      deleteAccount({
        credentials: useOAuthStore().token,
        password: this.deleteAccountConfirmPasswordInput,
      }).then(({ data: res }) => {
        if (res.status === 'success') {
          this.$store.dispatch('logout')
          this.$router.push({ name: 'root' })
        } else {
          this.deleteAccountError = res.error
        }
      })
    },
    changePassword() {
      const params = {
        password: this.changePasswordInputs[0],
        newPassword: this.changePasswordInputs[1],
        newPasswordConfirmation: this.changePasswordInputs[2],
        credentials: useOAuthStore().token,
      }
      changePassword(params).then(({ data: res }) => {
        if (res.status === 'success') {
          this.changedPassword = true
          this.changePasswordError = false
          this.logout()
        } else {
          this.changedPassword = false
          this.changePasswordError = res.error
        }
      })
    },
    changeEmail() {
      const params = {
        email: this.newEmail,
        password: this.changeEmailPassword,
        credentials: useOAuthStore().token,
      }
      changeEmail(params).then(({ data: res }) => {
        if (res.status === 'success') {
          this.changedEmail = true
          this.changeEmailError = false
        } else {
          this.changedEmail = false
          this.changeEmailError = res.error
        }
      })
    },
    moveAccount() {
      const params = {
        targetAccount: this.moveAccountTarget,
        password: this.moveAccountPassword,
        credentials: useOAuthStore().token,
      }
      moveAccount(params).then(({ data: res }) => {
        if (res.status === 'success') {
          this.movedAccount = true
          this.moveAccountError = false
        } else {
          this.movedAccount = false
          this.moveAccountError = res.error
        }
      })
    },
    removeAlias(alias) {
      deleteAlias({
        alias,
        credentials: useOAuthStore().token,
      }).then(() => this.fetchAliases())
    },
    addAlias() {
      addAlias({
        alias: this.addAliasTarget,
        credentials: useOAuthStore().token,
      })
        .then(() => {
          this.addedAlias = true
          this.addAliasError = false
          this.addAliasTarget = ''
        })
        .catch((error) => {
          this.addedAlias = false
          this.addAliasError = error
        })
        .then(() => this.fetchAliases())
    },
    fetchAliases() {
      listAliases({
        credentials: useOAuthStore().token,
      })
        .then(({ data: res }) => {
          this.aliases = res.aliases
          this.listAliasesError = false
        })
        .catch((error) => {
          this.listAliasesError = error.error
        })
    },
    logout() {
      this.$store.dispatch('logout')
      this.$router.replace('/')
    },
    revokeToken(id) {
      if (window.confirm(`${this.$i18n.t('settings.revoke_token')}?`)) {
        useOAuthTokensStore().revokeToken(id)
      }
    },
  },
}

export default SecurityTab
