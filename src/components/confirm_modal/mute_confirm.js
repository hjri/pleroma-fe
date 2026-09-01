import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Select from 'src/components/select/select.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

export default {
  props: ['type', 'user', 'status'],
  emits: ['hide', 'show', 'muted'],
  data: () => ({
    showing: false,
  }),
  components: {
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),

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
      return new Set(useUsersStore().currentUser.domainMutes).has(this.domain)
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
    ...mapState(useMergedConfigStore, ['mergedConfig']),
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
            useUsersStore().muteDomain(this.domain)
          } else {
            useUsersStore().unmuteDomain(this.domain)
          }
          break
        }
        case 'conversation': {
          if (!this.conversationIsMuted) {
            useStatusesStore().muteConversation(this.status.id)
          } else {
            useStatusesStore().unmuteConversation(this.status.id)
          }
          break
        }
      }
      this.$emit('muted')
      this.hide()
    },
  },
}
