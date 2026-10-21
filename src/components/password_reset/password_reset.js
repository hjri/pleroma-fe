import { mapState } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useUsersStore } from 'src/stores/users.js'

import { resetPassword } from 'src/api/public.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes)

const passwordReset = {
  data: () => ({
    user: {
      email: '',
    },
    isPending: false,
    success: false,
    throttled: false,
    error: null,
  }),
  computed: {
    ...mapState(useUsersStore, ['loggedIn']),
    ...mapState(useInstanceStore, ['mailerEnabled']),
  },
  created() {
    if (this.loggedIn) {
      this.$router.push({ name: 'root' })
    }
  },
  props: {
    passwordResetRequested: {
      default: false,
      type: Boolean,
    },
  },
  methods: {
    dismissError() {
      this.error = null
    },
    submit() {
      this.isPending = true
      const email = this.user.email

      resetPassword({ email })
        .then(({ status }) => {
          this.isPending = false
          this.user.email = ''

          if (status === 204) {
            this.success = true
            this.error = null
          } else if (status === 429) {
            this.throttled = true
            this.error = this.$t('password_reset.too_many_requests')
          }
        })
        .catch(() => {
          this.isPending = false
          this.user.email = ''
          this.error = this.$t('general.generic_error')
        })
    },
  },
}

export default passwordReset
