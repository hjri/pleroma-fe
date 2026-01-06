import { mapState } from 'vuex'

import BasicUserCard from '../basic_user_card/basic_user_card.vue'

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
      return this.user.block_expires_at !== undefined
    },
    blockExpiry() {
      return this.user.block_expires_at == null
        ? this.$t('user_card.block_expires_forever')
        : this.$t('user_card.block_expires_at', [
            new Date(this.user.mute_expires_at).toLocaleString(),
          ])
    },
    ...mapState({
      blockExpirationSupported: (state) => state.instance.blockExpiration,
    }),
  },
  components: {
    BasicUserCard,
  },
  methods: {
    unblockUser() {
      this.$store.dispatch('unblockUser', this.user.id)
    },
    blockUser() {
      if (this.blockExpirationSupported) {
        this.$refs.timedBlockDialog.optionallyPrompt()
      } else {
        this.$store.dispatch('blockUser', { id: this.user.id })
      }
    },
  },
}

export default BlockCard
