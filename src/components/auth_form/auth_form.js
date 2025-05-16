import { h, resolveComponent } from 'vue'
import LoginForm from '../login_form/login_form.vue'
import MFARecoveryForm from '../mfa_form/recovery_form.vue'
import MFATOTPForm from '../mfa_form/totp_form.vue'
import { mapState } from 'pinia'
import { useAuthFlowStore } from 'src/stores/auth_flow'

const AuthForm = {
  name: 'AuthForm',
  render () {
    return h(resolveComponent(this.authForm))
  },
  computed: {
    authForm () {
      if (this.requiredTOTP) { return 'MFATOTPForm' }
      if (this.requiredRecovery) { return 'MFARecoveryForm' }
      return 'LoginForm'
    },
    ...mapState(useAuthFlowStore, ['requiredTOTP', 'requiredRecovery'])
  },
  components: {
    MFARecoveryForm,
    MFATOTPForm,
    LoginForm
  }
}

export default AuthForm
