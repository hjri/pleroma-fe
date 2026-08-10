import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'

import { useUsersStore } from 'src/stores/users.js'

const MuteCard = {
  props: ['userId'],
  computed: {
    user() {
      return useUsersStore().findUser(this.userId)
    },
    relationship() {
      return useUsersStore().relationship(this.userId)
    },
    muted() {
      return this.relationship.muting
    },
    muteExpiryAvailable() {
      return Object.hasOwn(this.user, 'mute_expires_at')
    },
    muteExpiry() {
      return this.user.mute_expires_at === false
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
