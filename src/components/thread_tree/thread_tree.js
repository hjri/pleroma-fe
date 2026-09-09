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
  data() {
    return {
      resizeObserver: new ResizeObserver(this.updateVirtualHeight),
    }
  },
  mounted() {
    this.resizeObserver.observe(this.$refs.root)
  },
  unmounted() {
    this.resizeObserver.disconnect()
  },
  emits: [
    'heightChange',
    'suspendableStateChange',
    'goto',
    'dive',
    'toggleExpanded',
    'showThreadRecursively',
  ],
  inject: [
    'conversation',
    'focused',
    'replies',
    'threadDisplay',
    'isExpanded',
    'isPage',
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
    totalReplyCount() {
      const sizes = {}
      const subTreeSizeFor = (id) => {
        if (sizes[id]) {
          return sizes[id]
        }
        sizes[id] =
          1 +
          [...this.getReplies(id)]
            .map(({ id }) => id)
            .map((cid) => subTreeSizeFor(cid))
            .reduce((a, b) => a + b, 0)
        return sizes[id]
      }
      this.conversation.map((k) => k.id).forEach(subTreeSizeFor)
      return Object.keys(sizes).reduce((res, id) => {
        res[id] = sizes[id] - 1 // exclude itself
        return res
      }, {})
    },
    totalReplyDepth() {
      const depths = {}
      const subTreeDepthFor = (id) => {
        if (depths[id]) {
          return depths[id]
        }
        depths[id] =
          1 +
          [...this.getReplies(id)]
            .map(({ id }) => id)
            .map((cid) => subTreeDepthFor(cid))
            .reduce((a, b) => (a > b ? a : b), 0)
        return depths[id]
      }
      this.conversation.map((k) => k.id).forEach(subTreeDepthFor)
      return Object.keys(depths).reduce((res, id) => {
        res[id] = depths[id] - 1 // exclude itself
        return res
      }, {})
    },
  },
  methods: {
    getReplies(id) {
      return this.replies.get(id) ?? new Set()
    },
    updateVirtualHeight(e) {
      const [entry] = e
      this.$emit('heightChange', {
        id: this.statusId,
        height: entry.contentRect.height,
        element: this.$refs.root,
      })
    },
  },
}

export default ThreadTree
