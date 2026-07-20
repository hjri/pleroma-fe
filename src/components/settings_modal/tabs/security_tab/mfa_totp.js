import Confirm from './confirm.vue'

import { useOAuthStore } from 'src/stores/oauth.js'

import { mfaDisableOTP } from 'src/api/user.js'

export default {
  props: ['settings'],
  data: () => ({
    error: false,
    currentPassword: '',
    deactivate: false,
    inProgress: false, // progress peform request to disable otp method
  }),
  components: {
    confirm: Confirm,
  },
  computed: {
    isActivated() {
      return this.settings.totp
    },
  },
  methods: {
    doActivate() {
      this.$emit('activate')
    },
    cancelDeactivate() {
      this.deactivate = false
    },
    doDeactivate() {
      this.error = null
      this.deactivate = true
    },
    confirmDeactivate() {
      // confirm deactivate TOTP method
      this.error = null
      this.inProgress = true
      mfaDisableOTP({
        password: this.currentPassword,
        credentials: useOAuthStore().token,
      }).then(({ data: res }) => {
        this.inProgress = false
        if (res.error) {
          this.error = res.error
          return
        }
        this.deactivate = false
        this.$emit('deactivate')
      })
    },
  },
}
