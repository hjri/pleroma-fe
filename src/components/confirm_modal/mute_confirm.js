import { mapGetters } from 'vuex'

import Select from 'src/components/select/select.vue'
import ConfirmModal from './confirm_modal.vue'

export default {
  props: ['type', 'user', 'status'],
  emits: ['hide', 'show', 'muted'],
  data: () => ({
    showing: false,
  }),
  components: {
    ConfirmModal,
    Select,
  },
  computed: {
    domain() {
      return this.user.fqn.split('@')[1]
    },
    keypath() {
      if (this.type === 'domain') {
        return 'user_card.mute_domain_confirm'
      } else if (this.type === 'conversation') {
        return 'user_card.mute_conversation_confirm'
      }
    },
    conversationIsMuted() {
      return this.status.conversation_muted
    },
    domainIsMuted() {
      return new Set(this.$store.state.users.currentUser.domainMutes).has(
        this.domain,
      )
    },
    shouldConfirm() {
      switch (this.type) {
        case 'domain': {
          return this.mergedConfig.modalOnMuteDomain
        }
        default: {
          // conversation
          return this.mergedConfig.modalOnMuteConversation
        }
      }
    },
    ...mapGetters(['mergedConfig']),
  },
  methods: {
    optionallyPrompt() {
      if (this.shouldConfirm) {
        this.show()
      } else {
        this.doMute()
      }
    },
    show() {
      this.showing = true
      this.$emit('show')
    },
    hide() {
      this.showing = false
      this.$emit('hide')
    },
    doMute() {
      switch (this.type) {
        case 'domain': {
          if (!this.domainIsMuted) {
            this.$store.dispatch('muteDomain', this.domain)
          } else {
            this.$store.dispatch('unmuteDomain', this.domain)
          }
          break
        }
        case 'conversation': {
          if (!this.conversationIsMuted) {
            this.$store.dispatch('muteConversation', { id: this.status.id })
          } else {
            this.$store.dispatch('unmuteConversation', { id: this.status.id })
          }
          break
        }
      }
      this.$emit('muted')
      this.hide()
    },
  },
}
