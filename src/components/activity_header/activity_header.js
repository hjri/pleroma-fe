import Timeago from 'src/components/timeago/timeago.vue'
import UserLink from 'src/components/user_link/user_link.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAngleDoubleRight,
  faChevronDown,
  faChevronUp,
  faEllipsisH,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobe,
  faIgloo,
  faLock,
  faLockOpen,
  faPlay,
  faPlusSquare,
  faReply,
  faRetweet,
  faSmileBeam,
  faStar,
  faThumbtack,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faEnvelope,
  faGlobe,
  faIgloo,
  faLock,
  faLockOpen,
  faTimes,
  faRetweet,
  faReply,
  faPlusSquare,
  faStar,
  faSmileBeam,
  faEllipsisH,
  faEyeSlash,
  faEye,
  faThumbtack,
  faChevronUp,
  faChevronDown,
  faAngleDoubleRight,
  faPlay,
)

const ActivityHeader = {
  name: 'ActivityHeader',
  components: {
    Timeago,
    UserLink,
  },
  props: {
    statusId: String,
    statusoid: Object,
    userId: String,
    userObject: Object,
    replies: Set,
    expandable: Boolean,
    expanded: Boolean,
    time: Date,
    threadDisplayState: String,
    unmuted: Boolean,
    multiline: Boolean,
    // for notifications
    nonMention: Boolean,
  },
  emits: ['requestFocus', 'toggleExpanded', 'toggleThreadDisplay', 'toggleMuted'],
  computed: {
    // Whatever we're given to work with
    status() {
      return this.statusoid ?? useStatusesStore().allStatuses.get(this.statusId)
    },
    user() {
      return this.userObject ?? useUsersStore().findUser(this.userId)
    },
    // Config
    mergedConfig() {
      return useMergedConfigStore().mergedConfig
    },
    isTreeView() {
      return this.mergedConfig.conversationDisplay === 'tree'
    },
    simpleTree() {
      return !this.mergedConfig.conversationTreeAdvanced
    },
    allowNonSquareEmoji() {
      return this.mergedConfig.nonSquareEmoji
    },
    // Threading
    inThreadForest() {
      return !!this.threadDisplayState
    },
    threadShowing() {
      return this.threadDisplayState === 'showing'
    },
    // localization
    visibilityLocalized() {
      return this.$i18n.t(
        'general.scope_in_timeline.' + this.status?.visibility,
      )
    },
    visibilityIcon() {
      switch (this.status?.visibility) {
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
  },
}

export default ActivityHeader
