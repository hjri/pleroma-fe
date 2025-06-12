import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'

const UserTimedFilterModal = {
  data () {
    return {
      showing: false,
      dontAskAgain: false,
      expiration: (() => {
        const date = new Date()
        const fmt = new Intl.NumberFormat("en-US", {minimumIntegerDigits: 2})
        return [
          date.getFullYear(),
          '-',
          fmt.format(date.getMonth() + 1),
          '-',
          fmt.format(date.getDate()),
          'T',
          fmt.format(date.getHours()),
          ':',
          fmt.format(date.getMinutes())
        ].join('')
      })()
    }
  },
  components: {
    DialogModal,
    Checkbox
  },
  props: {
    isMute: Boolean,
    user: Object
  },
  emits: [
    'timed',
    'forever',
    'user'
  ],
  computed: {
    dateValid () {
      return (new Date(this.expiration).toJSON() != null) &&
        new Date(this.expiration) > new Date()
    },
    expiryTime () {
      return Math.floor((new Date(this.expiration).valueOf() - Date.now())  / 1000)
    },
    shouldConfirm () {
      if (this.isMute) {
        return this.mergedConfig.onMuteDefaultAction === 'ask'
      } else {
        return this.mergedConfig.onBlockDefaultAction === 'ask'
      }
    }
  },
  methods: {
    optionallyPrompt () {
      this.showing = true
    },
    temporarily () {
      if (this.isMute) {
        this.muteUserTemporarily()
      } else {
        this.blockUserTemporarily()
      }
      this.showing = false
    },
    forever () {
      if (this.isMute) {
        this.muteUserForever()
      } else {
        this.blockUserForever()
      }
      this.showing = false
    },
    blockUserForever () {
      this.$store.dispatch('blockUser', { id: this.user.id })
    },
    blockUserTemporarily () {
      this.$store.dispatch('blockUser', { id: this.user.id, expiresIn: this.expiryTime })
    },
    muteUserForever () {
      this.$store.dispatch('muteUser', { id: this.user.id })
    },
    muteUserTemporarily () {
      this.$store.dispatch('muteUser', { id: this.user.id, expiresIn: this.expiryTime })
    },
    cancel () {
      this.showing = false
    }
  }
}

export default UserTimedFilterModal
