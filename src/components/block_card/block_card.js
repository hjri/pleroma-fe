import { mapState } from 'pinia'

import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'

const BlockCard = {
  props: ['userId'],
  computed: {
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    relationship() {
      return this.$store.getters.relationship(this.userId)
    },
    blocked() {
      return this.relationship.blocking
    },
    blockExpiryAvailable() {
      return Object.hasOwn(this.user, 'block_expires_at')
    },
    blockExpiry() {
      return this.user.block_expires_at === false
        ? this.$t('user_card.block_expires_forever')
        : this.$t('user_card.block_expires_at', [
            new Date(this.user.mute_expires_at).toLocaleString(),
          ])
    },
    ...mapState(useInstanceCapabilitiesStore, ['blockExpiration']),
  },
  components: {
    BasicUserCard,
    UserTimedFilterModal,
  },
  methods: {
    unblockUser() {
      this.$store.dispatch('unblockUser', this.user.id)
    },
    blockUser() {
      if (this.blockExpiration) {
        this.$refs.timedBlockDialog.optionallyPrompt()
      } else {
        this.$store.dispatch('blockUser', { id: this.user.id })
      }
    },
  },
}

export default BlockCard
