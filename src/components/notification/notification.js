import { mapActions, mapState } from 'pinia'

import Report from 'src/components/report/report.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import Timeago from 'src/components/timeago/timeago.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserLink from 'src/components/user_link/user_link.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'
import { isStatusNotification } from '../../services/notification_utils/notification_utils_sw.js'
import {
  highlightClass,
  highlightStyle,
} from '../../services/user_highlighter/user_highlighter.js'

import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'
import { useUsersStore } from 'src/stores/users.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCheck,
  faCompressAlt,
  faExpandAlt,
  faEyeSlash,
  faRetweet,
  faStar,
  faSuitcaseRolling,
  faTimes,
  faUser,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faCheck,
  faTimes,
  faStar,
  faRetweet,
  faUserPlus,
  faUser,
  faEyeSlash,
  faSuitcaseRolling,
  faExpandAlt,
  faCompressAlt,
)

const Notification = {
  data() {
    return {
      selecting: false,
      statusExpanded: false,
      unmuted: false,
    }
  },
  props: ['notification'],
  emits: ['interacted'],
  components: {
    StatusContent,
    UserAvatar,
    Timeago,

    Report,

    UserPopover,
    UserLink,
  },
  mounted() {
    document.addEventListener('selectionchange', this.onContentSelect)
  },
  unmounted() {
    document.removeEventListener('selectionchange', this.onContentSelect)
  },
  methods: {
    toggleStatusExpanded() {
      if (!this.expandable) return
      this.statusExpanded = !this.statusExpanded
    },
    onContentSelect() {
      const { isCollapsed, anchorNode, offsetNode } = document.getSelection()
      if (isCollapsed) {
        this.selecting = false
        return
      }
      const within =
        this.$refs.root.contains(anchorNode) ||
        this.$refs.root.contains(offsetNode)
      if (within) {
        this.selecting = true
      } else {
        this.selecting = false
      }
    },
    onContentClick(e) {
      if (
        !this.selecting &&
        !e.target.closest('a') &&
        !e.target.closest('button')
      ) {
        this.toggleStatusExpanded()
      }
    },
    generateUserProfileLink(user) {
      return generateProfileLink(
        user.id,
        user.screen_name,
        useInstanceStore().restrictedNicknames,
      )
    },
    interacted() {
      this.$emit('interacted')
    },
    toggleMute() {
      this.unmuted = !this.unmuted
    },
    ...mapActions(useFollowRequestsStore, ['approve', 'deny']),
  },
  computed: {
    status() {
      // Used for StatusContent
      if (this.notification.status) {
        return useStatusesStore().allStatuses.get(this.notification.status.id)
      }
    },
    userClass() {
      return highlightClass(this.notification.from_profile)
    },
    userStyle() {
      const user = this.notification.from_profile.screen_name
      return highlightStyle(useUserHighlightStore().get(user))
    },
    expandable() {
      return new Set(['like', 'pleroma:emoji_reaction', 'repeat', 'poll']).has(
        this.notification.type,
      )
    },
    user() {
      return useUsersStore().findUser(this.notification.from_profile.id)
    },
    userProfileLink() {
      return this.generateUserProfileLink(this.user)
    },
    targetUser() {
      return useUsersStore().findUser(this.notification.target.id)
    },
    targetUserProfileLink() {
      return this.generateUserProfileLink(this.targetUser)
    },
    needMute() {
      return useUsersStore().relationship(this.user.id).muting
    },
    isStatusNotification() {
      return isStatusNotification(this.notification.type)
    },
    mergedConfig() {
      return useMergedConfigStore().mergedConfig
    },
    allowNonSquareEmoji() {
      return this.mergedConfig.nonSquareEmoji
    },
    pauseMfm() {
      return this.mergedConfig.pauseMfm
    },
    scaleMfm() {
      return this.mergedConfig.scaleMfm
    },
    ...mapState(useUsersStore, ['currentUser']),
  },
}

export default Notification
