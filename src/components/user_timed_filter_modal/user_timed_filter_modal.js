import Checkbox from 'src/components/checkbox/checkbox.vue'
import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'
import Select from 'src/components/select/select.vue'

import { durationStrToMs } from 'src/services/date_utils/date_utils.js'

const UserTimedFilterModal = {
  data() {
    const action = this.isMute
      ? this.$store.getters.mergedConfig.onMuteDefaultAction
      : this.$store.getters.mergedConfig.onBlockDefaultAction
    const doAsk = action === 'ask'
    const defaultValues = {}

    if (doAsk || action === 'forever') {
      defaultValues.expiration = 14
      defaultValues.expirationUnit = 'd'
      if (action === 'forever') {
        defaultValues.forever = true
      }
    } else {
      const unit = action.replace(/[0-9,.]+/, '')
      const value = action.replace(/[^0-9,.]+/, '')
      defaultValues.expiration = value
      defaultValues.expirationUnit = unit
    }

    return {
      showing: false,
      forever: false,
      dontAskAgain: false,
      ...defaultValues,
    }
  },
  components: {
    ConfirmModal,
    Select,
    Checkbox,
  },
  props: {
    isMute: Boolean,
    user: Object,
  },
  computed: {
    shouldConfirm() {
      if (this.isMute) {
        return this.$store.getters.mergedConfig.onMuteDefaultAction === 'ask'
      } else {
        return this.$store.getters.mergedConfig.onBlockDefaultAction === 'ask'
      }
    },
    expiryString() {
      return this.expiration.toString() + this.expirationUnit
    },
    expirySeconds() {
      return Math.floor(durationStrToMs(this.expiryString) / 1000)
    },
    requestBody() {
      const object = { id: this.user.id }
      if (!this.forever) {
        object.expiresIn = this.expirySeconds
      }
      return object
    },
  },
  watch: {
    expiration(newVal) {
      if (newVal <= 0) {
        this.expiration = 1
      }
    },
  },
  methods: {
    optionallyPrompt() {
      if (this.shouldConfirm) {
        this.showing = true
      } else {
        this.accept()
      }
    },
    accept() {
      if (this.isMute) {
        this.$store.dispatch('muteUser', this.requestBody)
        if (this.dontAskAgain) {
          this.$store.dispatch('setOption', {
            name: 'onMuteDefaultAction',
            value: this.expiryString,
          })
        }
      } else {
        this.$store.dispatch('blockUser', this.requestBody)
        if (this.dontAskAgain) {
          this.$store.dispatch('setOption', {
            name: 'onBlockDefaultAction',
            value: this.expiryString,
          })
        }
      }
      this.showing = false
    },
    cancel() {
      this.showing = false
    },
  },
}

export default UserTimedFilterModal
