import BasicUserCard from '../basic_user_card/basic_user_card.vue'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'

const MuteCard = {
  props: ['userId'],
  computed: {
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    relationship() {
      return this.$store.getters.relationship(this.userId)
    },
    muted() {
      return this.relationship.muting
    },
    muteExpiryAvailable() {
      return this.user.mute_expires_at !== undefined
    },
    muteExpiry() {
      return this.user.mute_expires_at == null
        ? this.$t('user_card.mute_expires_forever')
        : this.$t('user_card.mute_expires_at', [
            new Date(this.user.mute_expires_at).toLocaleString(),
          ])
    },
  },
  components: {
    BasicUserCard,
    UserTimedFilterModal,
  },
  methods: {
    unmuteUser() {
      this.$store.dispatch('unmuteUser', this.userId)
    },
    muteUser() {
      this.$refs.timedMuteDialog.optionallyPrompt()
    },
  },
}

export default MuteCard
