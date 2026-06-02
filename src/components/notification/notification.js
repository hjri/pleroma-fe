import { mapState } from 'vuex'

import RichContent from 'src/components/rich_content/rich_content.jsx'
import { isStatusNotification } from '../../services/notification_utils/notification_utils.js'
import {
  highlightClass,
  highlightStyle,
} from '../../services/user_highlighter/user_highlighter.js'
import ConfirmModal from '../confirm_modal/confirm_modal.vue'
import Report from '../report/report.vue'
import Status from '../status/status.vue'
import StatusContent from '../status_content/status_content.vue'
import Timeago from '../timeago/timeago.vue'
import UserAvatar from '../user_avatar/user_avatar.vue'
import UserLink from '../user_link/user_link.vue'
import UserPopover from '../user_popover/user_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'

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
      showingApproveConfirmDialog: false,
      showingDenyConfirmDialog: false,
    }
  },
  props: ['notification'],
  emits: ['interacted'],
  components: {
    StatusContent,
    UserAvatar,
    Timeago,
    Status,
    Report,
    RichContent,
    UserPopover,
    UserLink,
    ConfirmModal,
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
    getUser(notification) {
      return this.$store.state.users.usersObject[notification.from_profile.id]
    },
    interacted() {
      this.$emit('interacted')
    },
    toggleMute() {
      this.unmuted = !this.unmuted
    },
    showApproveConfirmDialog() {
      this.showingApproveConfirmDialog = true
    },
    hideApproveConfirmDialog() {
      this.showingApproveConfirmDialog = false
    },
    showDenyConfirmDialog() {
      this.showingDenyConfirmDialog = true
    },
    hideDenyConfirmDialog() {
      this.showingDenyConfirmDialog = false
    },
    approveUser() {
      if (this.shouldConfirmApprove) {
        this.showApproveConfirmDialog()
      } else {
        this.doApprove()
      }
    },
    doApprove() {
      this.$store.state.api.backendInteractor.approveUser({ id: this.user.id })
      this.$store.dispatch('removeFollowRequest', this.user)
      this.$store.dispatch('markSingleNotificationAsSeen', {
        id: this.notification.id,
      })
      this.$store.dispatch('updateNotification', {
        id: this.notification.id,
        updater: (notification) => {
          notification.type = 'follow'
        },
      })
      this.hideApproveConfirmDialog()
    },
    denyUser() {
      if (this.shouldConfirmDeny) {
        this.showDenyConfirmDialog()
      } else {
        this.doDeny()
      }
    },
    doDeny() {
      this.$store.state.api.backendInteractor
        .denyUser({ id: this.user.id })
        .then(() => {
          this.$store.dispatch('dismissNotificationLocal', {
            id: this.notification.id,
          })
          this.$store.dispatch('removeFollowRequest', this.user)
        })
      this.hideDenyConfirmDialog()
    },
  },
  computed: {
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
      return this.$store.getters.findUser(this.notification.from_profile.id)
    },
    userProfileLink() {
      return this.generateUserProfileLink(this.user)
    },
    targetUser() {
      return this.$store.getters.findUser(this.notification.target.id)
    },
    targetUserProfileLink() {
      return this.generateUserProfileLink(this.targetUser)
    },
    needMute() {
      return this.$store.getters.relationship(this.user.id).muting
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
    shouldConfirmApprove() {
      return this.mergedConfig.modalOnApproveFollow
    },
    shouldConfirmDeny() {
      return this.mergedConfig.modalOnDenyFollow
    },
    ...mapState({
      currentUser: (state) => state.users.currentUser,
    }),
  },
}

export default Notification
