import { defineAsyncComponent } from 'vue'

import Popover from 'src/components/popover/popover.vue'
import ActionButton from './action_button.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEnvelope,
  faEye,
  faEyeSlash,
  faFolderTree,
  faGlobe,
  faLock,
  faLockOpen,
  faUser,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faUser,
  faGlobe,
  faFolderTree,
  faEye,
  faEyeSlash,
  faLock,
  faLockOpen,
  faEnvelope,
)

export default {
  components: {
    ActionButton,
    Popover,
    MuteConfirm: defineAsyncComponent(
      () => import('src/components/confirm_modal/mute_confirm.vue'),
    ),
    UserTimedFilterModal: defineAsyncComponent(
      () =>
        import(
          'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'
        ),
    ),
  },
  props: ['button', 'status'],
  emits: ['emojiPickerShown'],
  mounted() {
    if (this.button.name === 'mute') {
      this.$store.dispatch('fetchDomainMutes')
    }
  },
  computed: {
    buttonClass() {
      return [
        this.button.name + '-button',
        {
          '-with-extra': this.button.name === 'bookmark',
          '-extra': this.extra,
          '-quick': !this.extra,
        },
      ]
    },
    user() {
      return this.status.user
    },
    userIsMuted() {
      return this.$store.getters.relationship(this.user.id).muting
    },
    conversationIsMuted() {
      return this.status.thread_muted
    },
    domain() {
      return this.user.fqn.split('@')[1]
    },
    domainIsMuted() {
      return new Set(this.$store.state.users.currentUser.domainMutes).has(
        this.domain,
      )
    },
    availableScopes() {
      return ['private', 'unlisted', 'direct', 'public'].filter((scope) => {
        return scope !== this.status.visibility
      })
    },
  },
  methods: {
    visibilityIcon(visibility) {
      switch (visibility) {
        case 'private':
          return 'lock'
        case 'unlisted':
          return 'lock-open'
        case 'direct':
          return 'envelope'
        case 'local':
          return 'igloo'
        default:
          return 'globe'
      }
    },
    unmuteUser() {
      return this.$store.dispatch('unmuteUser', this.user.id)
    },
    unmuteConversation() {
      return this.$store.dispatch('unmuteConversation', { id: this.status.id })
    },
    unmuteDomain() {
      return this.$store.dispatch('unmuteDomain', this.domain)
    },
    toggleUserMute() {
      if (this.userIsMuted) {
        this.unmuteUser()
      } else {
        this.$refs.confirmUser.optionallyPrompt()
      }
    },
    setScope(visibility) {
      return useAdminSettingsStore().changeStatusScope({
        id: this.status.id,
        visibility,
      })
    },
    setSensitive(sensitive) {
      useAdminSettingsStore().changeStatusScope({
        id: this.status.id,
        sensitive,
      })
    },
    toggleConversationMute() {
      if (this.conversationIsMuted) {
        this.unmuteConversation()
      } else {
        this.$refs.confirmConversation.optionallyPrompt()
      }
    },
    toggleDomainMute() {
      if (this.domainIsMuted) {
        this.unmuteDomain()
      } else {
        this.$refs.confirmDomain.optionallyPrompt()
      }
    },
  },
}
