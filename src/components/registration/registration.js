import useVuelidate from '@vuelidate/core'
import { required, requiredIf, sameAs } from '@vuelidate/validators'
import { mapState as mapPiniaState } from 'pinia'
import { mapActions, mapState } from 'vuex'

import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import TermsOfServicePanel from 'src/components/terms_of_service_panel/terms_of_service_panel.vue'
import localeService from '../../services/locale/locale.service.js'

import { useInstanceStore } from 'src/stores/instance.js'

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
    if ((!this.registrationOpen && !this.token) || this.signedIn) {
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
    ...mapPiniaState(useInstanceStore, {
      registrationOpen: (store) => store.registrationOpen,
      embeddedToS: (store) => store.embeddedToS,
      termsOfService: (store) => store.tos,
      accountActivationRequired: (store) => store.accountActivationRequired,
      accountApprovalRequired: (store) => store.accountApprovalRequired,
      birthdayRequired: (store) => store.birthdayRequired,
      birthdayMinAge: (store) => store.birthdayMinAge,
    }),
    ...mapState({
      signedIn: (state) => !!state.users.currentUser,
      isPending: (state) => state.users.signUpPending,
      serverValidationErrors: (state) => state.users.signUpErrors,
      signUpNotice: (state) => state.users.signUpNotice,
      hasSignUpNotice: (state) => !!state.users.signUpNotice.message,
    }),
  },
  methods: {
    ...mapActions(['signUp', 'getCaptcha']),
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
