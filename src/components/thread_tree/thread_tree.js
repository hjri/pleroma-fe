import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAngleDoubleDown,
  faAngleDoubleRight,
} from '@fortawesome/free-solid-svg-icons'

library.add(faAngleDoubleDown, faAngleDoubleRight)

const ThreadTree = {
  components: {},
  name: 'ThreadTree',
  props: {
    depth: Number,
    statusId: String,
    inProfile: Boolean,
    conversation: Array,
    collapsable: Boolean,
    isExpanded: Boolean,
    pinnedStatusIdsObject: Object,
    profileUserId: String,

    focused: String,
    getReplies: Function,
    toggleExpanded: Function,

    simple: Boolean,
    canDive: Boolean,
    threadDisplayStatus: Object,
    showThreadRecursively: Function,
    totalReplyCount: Object,
    totalReplyDepth: Object,
  },
  emits: ['suspendableStateChange', 'goto', 'dive'],
  computed: {
    currentReplies() {
      return this.getReplies(this.statusId).map(({ id }) => id)
    },
    threadShowing() {
      return this.threadDisplayStatus[this.statusId] === 'showing'
    },
  },
}

export default ThreadTree
