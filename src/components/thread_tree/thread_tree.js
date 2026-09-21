import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

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
    statusId: String,
    depth: Number,
  },
  emits: [
    'suspendableStateChange',
    'goto',
    'dive',
    'toggleExpanded',
    'toggleThreadDisplay',
    'showThreadRecursively',
  ],
  inject: [
    'conversation',
    'focusedId',
    'replies',
    'threadDisplay',
    'isExpanded',
    'isPage',
    'totalReplyCount',
    'totalReplyDepth',
  ],
  computed: {
    status() {
      const status = useStatusesStore().allStatuses.get(this.statusId)
      if (status.retweeted_status) {
        return useStatusesStore().allStatuses.get(status.retweeted_status.id)
      }
      return status
    },
    currentReplies() {
      return [...this.getReplies(this.status.id)].map(({ id }) => id)
    },
    simple() {
      return !useMergedConfigStore().mergedConfig.conversationTreeAdvanced
    },
    threadShowing() {
      return this.threadDisplay.get(this.status.id) === 'showing'
    },
    canDive() {
      return this.isExpanded
    },
  },
  methods: {
    getReplies(id) {
      return this.replies.get(id) ?? new Set()
    },
  },
}

export default ThreadTree
