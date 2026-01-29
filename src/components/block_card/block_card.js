import { mapState } from 'pinia'

import BasicUserCard from '../basic_user_card/basic_user_card.vue'

import { useInstanceStore } from 'src/stores/instance.js'

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
    ...mapState(useInstanceStore, {
      blockExpirationSupported: (store) => store.featureSet.blockExpiration,
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
