import useVuelidate from '@vuelidate/core'
import { required, requiredIf, sameAs } from '@vuelidate/validators'
import { mapActions, mapState } from 'pinia'

import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import TermsOfServicePanel from 'src/components/terms_of_service_panel/terms_of_service_panel.vue'
import localeService from '../../services/locale/locale.service.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { getCaptcha, register } from 'src/api/public.js'
import { DAY } from 'src/services/date_utils/date_utils.js'

const registration = {
  setup() {
    return { v$: useVuelidate() }
  },
  data: () => ({
    user: {
      email: '',
      fullname: '',
      username: '',
      password: '',
      confirm: '',
      birthday: '',
      reason: '',
      language: [''],
    },
    signUpPending: false,
    signUpErrors: [],
    signUpNotice: {},
    captcha: {},
  }),
  components: {
    InterfaceLanguageSwitcher,
    TermsOfServicePanel,
  },
  validations() {
    return {
      user: {
        email: { required: requiredIf(() => this.accountActivationRequired) },
        username: { required },
        fullname: { required },
        password: { required },
        confirm: {
          required,
          sameAs: sameAs(this.user.password),
        },
        birthday: {
          required: requiredIf(() => this.birthdayRequired),
          maxValue: (value) => {
            return (
              !this.birthdayRequired ||
              new Date(value).getTime() <= this.birthdayMin.getTime()
            )
          },
        },
        reason: { required: requiredIf(() => this.accountApprovalRequired) },
        language: {},
      },
    }
  },
  created() {
    if ((!this.registrationOpen && !this.token) || this.loggedIn) {
      this.$router.push({ name: 'root' })
    }

    this.setCaptcha()
  },
  computed: {
    token() {
      return this.$route.params.token
    },
    bioPlaceholder() {
      return this.replaceNewlines(this.$t('registration.bio_placeholder'))
    },
    reasonPlaceholder() {
      return this.replaceNewlines(this.$t('registration.reason_placeholder'))
    },
    birthdayMin() {
      const minAge = this.birthdayMinAge
      const today = new Date()
      today.setUTCMilliseconds(0)
      today.setUTCSeconds(0)
      today.setUTCMinutes(0)
      today.setUTCHours(0)
      const minDate = new Date()
      minDate.setTime(today.getTime() - minAge * DAY)
      return minDate
    },
    birthdayMinAttr() {
      return this.birthdayMin.toJSON().replace(/T.+$/, '')
    },
    birthdayMinFormatted() {
      const browserLocale = localeService.internalToBrowserLocale(
        this.$i18n.locale,
      )
      return (
        this.user.birthday &&
        new Date(Date.parse(this.birthdayMin)).toLocaleDateString(
          browserLocale,
          { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' },
        )
      )
    },
    hasSignUpNotice(state) {
      return this.signUpNotice.message
    },
    ...mapState(useInstanceStore, {
      registrationOpen: (store) => store.registrationOpen,
      embeddedToS: (store) => store.embeddedToS,
      termsOfService: (store) => store.tos,
      accountActivationRequired: (store) => store.accountActivationRequired,
      accountApprovalRequired: (store) => store.accountApprovalRequired,
      birthdayRequired: (store) => store.birthdayRequired,
      birthdayMinAge: (store) => store.birthdayMinAge,
    }),
    ...mapState(useUsersStore, ['loggedIn']),
  },
  methods: {
    ...mapActions(useUsersStore, ['loginUser']),
    getCaptcha(store) {
      return getCaptcha({
        credentials: useOAuthStore().token,
      }).then(({ data }) => data)
    },
    async signUp(userInfo) {
      const oauthStore = useOAuthStore()

      this.signUpPending = true
      this.signUpErrors = []
      this.signUpNotice = {}

      try {
        const token = await oauthStore.ensureAppToken()
        const { data } = await register({
          credentials: token,
          params: { ...userInfo },
        })

        if (data.access_token) {
          this.signUpPending = false
          oauthStore.setToken(data.access_token)
          await this.loginUser(data.access_token)
          return 'ok'
        } else {
          // Request succeeded, but user cannot login yet.
          this.signUpErrors = []
          this.signUpNotice = data
          return 'request_sent'
        }
      } catch (e) {
        const errors = e.message
        this.signUpErrors = errors
        this.signUpNotice = {}
        throw e
      } finally {
        this.signUpPending = false
      }
    },
    async submit() {
      this.user.nickname = this.user.username
      this.user.token = this.token

      this.user.captcha_solution = this.captcha.solution
      this.user.captcha_token = this.captcha.token
      this.user.captcha_answer_data = this.captcha.answer_data
      if (this.user.language) {
        this.user.language = localeService.internalToBackendLocaleMulti(
          this.user.language.filter(Boolean),
        )
      }

      this.v$.$touch()

      if (!this.v$.$invalid) {
        try {
          const status = await this.signUp(this.user)
          if (status === 'ok') {
            this.$router.push({ name: 'friends' })
          }
          // If status is not 'ok' (i.e. it needs further actions to be done
          // before you can login), display sign up notice, do not switch anywhere
        } catch (error) {
          console.warn('Registration failed: ', error)
          this.setCaptcha()
        }
      }
    },
    setCaptcha() {
      this.getCaptcha().then((cpt) => {
        this.captcha = cpt
      })
    },
    replaceNewlines(str) {
      return str.replaceAll(/\s*\n\s*/g, ' \n')
    },
  },
}

export default registration
