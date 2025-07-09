import BasicUserCard from '../basic_user_card/basic_user_card.vue'

const BlockCard = {
  props: ['userId'],
  computed: {
    user () {
      return this.$store.getters.findUser(this.userId)
    },
    relationship () {
      return this.$store.getters.relationship(this.userId)
    },
    blocked () {
      return this.relationship.blocking
    },
    blockExpiry () {
      console.log(this.user)
      return this.user.block_expires_at == null
        ? this.$t('user_card.block_expires_forever')
        : this.$t('user_card.block_expires_at', [new Date(this.user.mute_expires_at).toLocaleString()])
    }
  },
  components: {
    BasicUserCard
  },
  methods: {
    unblockUser () {
      this.progress = true
      this.$store.dispatch('unblockUser', this.user.id).then(() => {
        this.progress = false
      })
    },
    blockUser () {
      this.$refs.timedBlockDialog.optionallyPrompt()
    }
  }
}

export default BlockCard
