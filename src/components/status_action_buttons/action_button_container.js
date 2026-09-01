import { defineAsyncComponent } from 'vue'

import Popover from 'src/components/popover/popover.vue'
import ActionButton from './action_button.vue'

import { useAdminSettingsStore } from 'src/stores/admin_settings.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import genRandomSeed from 'src/services/random_seed/random_seed.service.js'

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
  props: ['button', 'status', 'defaultButton', 'hideLabel'],
  emits: ['emojiPickerShown'],
  mounted() {
    if (this.button.name === 'mute') {
      useUsersStore().fetchDomainMutes()
    }
  },
  data() {
    return {
      randomSeed: genRandomSeed(),
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
      return useUsersStore().relationship(this.user.id).muting
    },
    conversationIsMuted() {
      return this.status.thread_muted
    },
    domain() {
      return this.user.fqn.split('@')[1]
    },
    domainIsMuted() {
      return new Set(useUsersStore().currentUser.domainMutes).has(this.domain)
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
      return useUsersStore().unmuteUser(this.user.id)
    },
    unmuteConversation() {
      return useStatusesStore().unmuteConversation(this.status.id)
    },
    unmuteDomain() {
      return useUsersStore().unmuteDomain(this.domain)
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
