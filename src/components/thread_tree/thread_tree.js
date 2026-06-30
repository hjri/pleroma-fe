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
    status: Object,
    inProfile: Boolean,
    conversation: Array,
    collapsable: Boolean,
    isExpanded: Boolean,
    pinnedStatusIdsObject: Object,
    profileUserId: String,

    isFocusedFunction: Function,
    highlight: String,
    getReplies: Function,
    setHighlight: Function,
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
    reverseLookupTable() {
      return this.conversation.reduce(
        (table, status, index) => {
          table[status.id] = index
          return table
        },
        {
          /* no-op */
        },
      )
    },
    currentReplies() {
      return this.getReplies(this.status.id).map(({ id }) =>
        this.statusById(id),
      )
    },
    threadShowing() {
      return this.threadDisplayStatus[this.status.id] === 'showing'
    },
  },
  methods: {
    statusById(id) {
      return this.conversation[this.reverseLookupTable[id]]
    },
  },
}

export default ThreadTree
