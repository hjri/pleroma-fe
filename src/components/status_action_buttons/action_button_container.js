import ActionButton from './action_button.vue'
import Popover from 'src/components/popover/popover.vue'
import MuteConfirm from 'src/components/confirm_modal/mute_confirm.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faUser,
  faGlobe,
  faFolderTree
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faUser,
  faGlobe,
  faFolderTree
)

export default {
  components: {
    ActionButton,
    Popover,
    MuteConfirm
  },
  props: ['button', 'status'],
  emits: ['interacted'],
  mounted () {
    if (this.button.name === 'mute') {
      this.$store.dispatch('fetchDomainMutes')
    }
  },
  computed: {
    buttonClass () {
      return [
        this.button.name + '-button',
        {
          '-with-extra': this.button.name === 'bookmark',
          '-extra': this.extra,
          '-quick': !this.extra
        }
      ]
    },
    user () {
      return this.status.user
    },
    userIsMuted () {
      return this.$store.getters.relationship(this.user.id).muting
    },
    conversationIsMuted () {
      return this.status.thread_muted
    },
    domain () {
      return this.user.fqn.split('@')[1]
    },
    domainIsMuted () {
      return new Set(this.$store.state.users.currentUser.domainMutes).has(this.domain)
    }
  },
  methods: {
    unmuteUser () {
      return this.$store.dispatch('unmuteUser', this.user.id)
    },
    unmuteConversation () {
      return this.$store.dispatch('unmuteConversation', { id: this.status.id })
    },
    unmuteDomain () {
      return this.$store.dispatch('unmuteDomain', this.user.id)
    },
    toggleUserMute () {
      if (this.userIsMuted) {
        this.unmuteUser()
      } else {
        this.$refs.confirmUser.optionallyPrompt()
      }
    },
    toggleConversationMute () {
      if (this.conversationIsMuted) {
        this.unmuteConversation()
      } else {
        this.$refs.confirmConversation.optionallyPrompt()
      }
    },
    toggleDomainMute () {
      if (this.domainIsMuted) {
        this.unmuteDomain()
      } else {
        this.$refs.confirmDomain.optionallyPrompt()
      }
    }
  }
}
