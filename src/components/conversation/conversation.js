import { clone, filter, findIndex, get, reduce } from 'lodash'
import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import ThreadTree from 'src/components/thread_tree/thread_tree.vue'

import { useInterfaceStore } from 'src/stores/interface'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchConversation, fetchStatus } from 'src/api/public.js'
import { WSConnectionStatus } from 'src/api/websocket.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAngleDoubleDown,
  faAngleDoubleLeft,
  faChevronLeft,
  faReply,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faAngleDoubleDown,
  faAngleDoubleLeft,
  faChevronLeft,
  faReply,
  faTimes,
)

const sortById = (a, b) => {
  const idA = a.type === 'retweet' ? a.retweeted_status.id : a.id
  const idB = b.type === 'retweet' ? b.retweeted_status.id : b.id
  const seqA = Number(idA)
  const seqB = Number(idB)
  const isSeqA = !Number.isNaN(seqA)
  const isSeqB = !Number.isNaN(seqB)
  if (isSeqA && isSeqB) {
    return seqA < seqB ? -1 : 1
  } else if (isSeqA && !isSeqB) {
    return -1
  } else if (!isSeqA && isSeqB) {
    return 1
  } else {
    return idA < idB ? -1 : 1
  }
}

const sortAndFilterConversation = (conversation, statusoid) => {
  if (statusoid.type === 'retweet') {
    conversation = filter(
      conversation,
      (status) =>
        status.type === 'retweet' ||
        status.id !== statusoid.retweeted_status.id,
    )
  } else {
    conversation = filter(conversation, (status) => status.type !== 'retweet')
  }
  return conversation.filter((_) => _).sort(sortById)
}

const conversation = {
  props: {
    statusId: {
      // Main thing
      type: String,
      required: true,
    },
    collapsable: {
      // Whether conversation can be collapsed
      // i.e. when it's not a page
      type: Boolean,
      default: false,
    },
    isPage: {
      // Whether conversation is rendered as a standalone page
      // as opposed to embedded into a timeline
      type: Boolean,
      default: false,
    },
    pinnedStatusIdsObject: {
      // Used for user profile, map of pinned statuses
      type: Object,
      default: null,
    },
    inProfile: {
      // Whether conversation is rendered in a user profile
      // used for overriding muted status
      type: Boolean,
      default: false,
    },
    profileUserId: {
      // used with inProfile, user id of the profile
      type: String,
      default: null,
    },
    virtualHidden: {
      // Whether conversation is suspended. Controls rendering of statuses
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      focused: null,
      expanded: false,
      threadDisplayStatusObject: {}, // id => 'showing' | 'hidden'
      inlineDivePosition: null,
      loadStatusError: null,
      unsuspendibleIds: new Set(),
      explicitReplyStatus: null,
    }
  },
  created() {
    if (this.isPage) {
      this.fetchConversation()
    }
  },
  computed: {
    maxDepthToShowByDefault() {
      // maxDepthInThread = max number of depths that is *visible*
      // since our depth starts with 0 and "showing" means "showing children"
      // there is a -2 here
      const maxDepth = this.mergedConfig.maxDepthInThread - 2
      return maxDepth >= 1 ? maxDepth : 1
    },
    lastStatus() {
      return this.conversation[this.conversation.length - 1]
    },
    replyStatus() {
      return this.explicitReplyStatus ?? this.lastStatus
    },
    streamingEnabled() {
      return (
        this.mergedConfig.useStreamingApi &&
        this.mastoUserSocketStatus === WSConnectionStatus.JOINED
      )
    },
    displayStyle() {
      return this.mergedConfig.conversationDisplay
    },
    treeViewIsSimple() {
      return !this.mergedConfig.conversationTreeAdvanced
    },
    isTreeView() {
      return this.displayStyle === 'tree'
    },
    isLinearView() {
      return this.displayStyle === 'linear'
    },
    isChatView() {
      return this.displayStyle === 'chat'
    },
    shouldFadeAncestors() {
      return this.mergedConfig.conversationTreeFadeAncestors
    },
    otherRepliesButtonPosition() {
      return this.mergedConfig.conversationOtherRepliesButton
    },
    showOtherRepliesButtonBelowStatus() {
      return this.otherRepliesButtonPosition === 'below'
    },
    showOtherRepliesButtonInsideStatus() {
      return this.otherRepliesButtonPosition === 'inside'
    },
    suspendable() {
      return this.unsuspendibleIds.size > 0
    },
    hideStatus() {
      return this.virtualHidden && this.suspendable
    },
    status() {
      return this.$store.state.statuses.allStatusesObject[this.statusId]
    },
    originalStatusId() {
      if (this.status.retweeted_status) {
        return this.status.retweeted_status.id
      } else {
        return this.statusId
      }
    },
    conversationId() {
      return this.getConversationId(this.statusId)
    },
    conversation() {
      if (!this.status) {
        return []
      }

      if (!this.isExpanded) {
        return [this.status]
      }

      const conversation = clone(
        this.$store.state.statuses.conversationsObject[this.conversationId],
      )
      const statusIndex = findIndex(conversation, { id: this.originalStatusId })
      if (statusIndex !== -1) {
        conversation[statusIndex] = this.status
      }

      return sortAndFilterConversation(conversation, this.status)
    },
    statusMap() {
      return this.conversation.reduce((res, s) => {
        res[s.id] = s
        return res
      }, {})
    },
    threadTree() {
      const reverseLookupTable = this.conversation.reduce(
        (table, status, index) => {
          table[status.id] = index
          return table
        },
        {},
      )

      const threads = this.conversation.reduce(
        (a, cur) => {
          const id = cur.id
          a.forest[id] = this.getReplies(id).map((s) => s.id)

          return a
        },
        {
          forest: {},
        },
      )

      const walk = (forest, topLevel, depth = 0, processed = {}) =>
        topLevel
          .map((id) => {
            if (processed[id]) {
              return []
            }

            processed[id] = true
            return [
              {
                status: this.conversation[reverseLookupTable[id]],
                id,
                depth,
              },
              walk(forest, forest[id], depth + 1, processed),
            ].reduce((a, b) => a.concat(b), [])
          })
          .reduce((a, b) => a.concat(b), [])

      const linearized = walk(
        threads.forest,
        this.topLevel.map((k) => k.id),
      )

      return linearized
    },
    replyIds() {
      return this.conversation
        .map((k) => k.id)
        .reduce((res, id) => {
          res[id] = (this.replies[id] || []).map((k) => k.id)
          return res
        }, {})
    },
    totalReplyCount() {
      const sizes = {}
      const subTreeSizeFor = (id) => {
        if (sizes[id]) {
          return sizes[id]
        }
        sizes[id] =
          1 +
          this.replyIds[id]
            .map((cid) => subTreeSizeFor(cid))
            .reduce((a, b) => a + b, 0)
        return sizes[id]
      }
      this.conversation.map((k) => k.id).map(subTreeSizeFor)
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
          this.replyIds[id]
            .map((cid) => subTreeDepthFor(cid))
            .reduce((a, b) => (a > b ? a : b), 0)
        return depths[id]
      }
      this.conversation.map((k) => k.id).map(subTreeDepthFor)
      return Object.keys(depths).reduce((res, id) => {
        res[id] = depths[id] - 1 // exclude itself
        return res
      }, {})
    },
    depths() {
      return this.threadTree.reduce((a, k) => {
        a[k.id] = k.depth
        return a
      }, {})
    },
    topLevel() {
      const topLevel = this.conversation.reduce(
        (tl, cur) =>
          tl.filter(
            (k) =>
              this.getReplies(cur.id)
                .map((v) => v.id)
                .indexOf(k.id) === -1,
          ),
        this.conversation,
      )
      return topLevel
    },
    otherTopLevelCount() {
      return this.topLevel.length - 1
    },
    showingTopLevel() {
      if (this.canDive && this.diveRoot) {
        return [this.statusMap[this.diveRoot]]
      }
      return this.topLevel
    },
    diveRoot() {
      const statusId = this.inlineDivePosition || this.statusId
      const isTopLevel = !this.parentOf(statusId)
      return isTopLevel ? null : statusId
    },
    diveDepth() {
      return this.canDive && this.diveRoot ? this.depths[this.diveRoot] : 0
    },
    diveMode() {
      return this.canDive && !!this.diveRoot
    },
    shouldShowAllConversationButton() {
      // The "show all conversation" button tells the user that there exist
      // other toplevel statuses, so do not show it if there is only a single root
      return (
        this.isTreeView &&
        this.isExpanded &&
        this.diveMode &&
        this.topLevel.length > 1
      )
    },
    shouldShowAncestors() {
      return (
        this.isTreeView &&
        this.isExpanded &&
        this.ancestorsOf(this.diveRoot).length
      )
    },
    replies() {
      let i = 1

      return reduce(
        this.conversation,
        (result, { id, in_reply_to_status_id: irid }) => {
          if (irid) {
            result[irid] = result[irid] || []
            result[irid].push({
              name: `#${i}`,
              id,
            })
          }
          i++
          return result
        },
        {},
      )
    },
    isExpanded() {
      return !!(this.expanded || this.isPage)
    },
    hiddenStyle() {
      const height = (this.status && this.status.virtualHeight) || '120px'
      return this.virtualHidden ? { height } : {}
    },
    threadDisplayStatus() {
      return this.conversation.reduce((a, k) => {
        const id = k.id
        const depth = this.depths[id]
        const status = (() => {
          if (this.threadDisplayStatusObject[id]) {
            return this.threadDisplayStatusObject[id]
          }
          if (depth - this.diveDepth <= this.maxDepthToShowByDefault) {
            return 'showing'
          } else {
            return 'hidden'
          }
        })()

        a[id] = status
        return a
      }, {})
    },
    canDive() {
      return this.isTreeView && this.isExpanded
    },
    maybeFocused() {
      return this.isExpanded ? this.focused : null
    },
    ...mapPiniaState(useMergedConfigStore, ['mergedConfig']),
    ...mapState({
      mastoUserSocketStatus: (state) => state.api.mastoUserSocketStatus,
    }),
    ...mapPiniaState(useInterfaceStore, {
      mobileLayout: (store) => store.layoutType === 'mobile',
    }),
  },
  components: {
    ThreadTree,
    QuickFilterSettings,
    QuickViewSettings,
    ChatMessageList,
    PostStatusForm,
    RichContent,
  },
  watch: {
    statusId(newVal, oldVal) {
      const newConversationId = this.getConversationId(newVal)
      const oldConversationId = this.getConversationId(oldVal)
      if (
        newConversationId &&
        oldConversationId &&
        newConversationId === oldConversationId
      ) {
        this.setFocused(this.originalStatusId)
      } else {
        this.fetchConversation()
      }
    },
    expanded(value) {
      if (value) {
        this.fetchConversation()
      } else {
        this.resetDisplayState()
      }
    },
    virtualHidden() {
      this.$store.dispatch('setVirtualHeight', {
        statusId: this.statusId,
        height: `${this.$el.clientHeight}px`,
      })
    },
  },
  methods: {
    fetchConversation() {
      if (this.status) {
        fetchConversation({
          id: this.statusId,
          credentials: useOAuthStore().token,
        }).then(({ data: { ancestors, descendants } }) => {
          this.$store.dispatch('addNewStatuses', { statuses: ancestors })
          this.$store.dispatch('addNewStatuses', { statuses: descendants })
          this.setFocused(this.originalStatusId)
        })
      } else {
        this.loadStatusError = null
        fetchStatus({
          id: this.statusId,
          credentials: useOAuthStore().token,
        })
          .then(({ data: status }) => {
            this.$store.dispatch('addNewStatuses', { statuses: [status] })
            this.fetchConversation()
          })
          .catch((error) => {
            console.error(error)
            this.loadStatusError = error
          })
      }
    },
    getReplies(id) {
      return this.replies[id] || []
    },
    setFocused(id) {
      if (!id) return
      this.focused = id

      if (!this.streamingEnabled) {
        this.$store.dispatch('fetchStatus', id)
      }

      this.$store.dispatch('fetchFavsAndRepeats', id)
      this.$store.dispatch('fetchEmojiReactionsBy', id)
    },
    toggleExpanded() {
      this.expanded = !this.expanded
    },
    getConversationId(statusId) {
      const status = this.$store.state.statuses.allStatusesObject[statusId]
      return get(
        status,
        'retweeted_status.statusnet_conversation_id',
        get(status, 'statusnet_conversation_id'),
      )
    },
    setThreadDisplay(id, nextStatus) {
      this.threadDisplayStatusObject = {
        ...this.threadDisplayStatusObject,
        [id]: nextStatus,
      }
    },
    toggleThreadDisplay(id) {
      const curStatus = this.threadDisplayStatus[id]
      const nextStatus = curStatus === 'showing' ? 'hidden' : 'showing'
      this.setThreadDisplay(id, nextStatus)
    },
    setThreadDisplayRecursively(id, nextStatus) {
      this.setThreadDisplay(id, nextStatus)
      this.getReplies(id)
        .map((k) => k.id)
        .map((id) => this.setThreadDisplayRecursively(id, nextStatus))
    },
    showThreadRecursively(id) {
      this.setThreadDisplayRecursively(id, 'showing')
    },
    leastVisibleAncestor(id) {
      let cur = id
      let parent = this.parentOf(cur)
      while (cur) {
        // if the parent is showing it means cur is visible
        if (this.threadDisplayStatus[parent] === 'showing') {
          return cur
        }
        parent = this.parentOf(parent)
        cur = this.parentOf(cur)
      }
      // nothing found, fall back to toplevel
      return this.topLevel[0] ? this.topLevel[0].id : undefined
    },
    diveIntoStatus(id) {
      this.tryScrollTo(id)
    },
    diveToTopLevel() {
      this.tryScrollTo(
        this.topLevelAncestorOrSelfId(this.diveRoot) || this.topLevel[0].id,
      )
    },
    // only used when we are not on a page
    undive() {
      this.inlineDivePosition = null
      this.setFocused(this.statusId)
    },
    tryScrollTo(id) {
      if (!id) {
        return
      }
      if (this.isPage) {
        // set statusId
        this.$router.push({ name: 'conversation', params: { id } })
      } else {
        this.inlineDivePosition = id
      }
      // Because the conversation can be unmounted when out of sight
      // and mounted again when it comes into sight,
      // the `mounted` or `created` function in `status` should not
      // contain scrolling calls, as we do not want the page to jump
      // when we scroll with an expanded conversation.
      //
      // Now the method is to rely solely on the `focused` watcher
      // in `status` components.
      // In linear views, all statuses are rendered at all times, but
      // in tree views, it is possible that a change in active status
      // removes and adds status components (e.g. an originally child
      // status becomes an ancestor status, and thus they will be
      // different).
      // Here, let the components be rendered first, in order to trigger
      // the `focused` watcher.
      this.$nextTick(() => {
        this.setFocused(id)
      })
    },
    goToCurrent() {
      this.tryScrollTo(this.diveRoot || this.topLevel[0].id)
    },
    statusById(id) {
      return this.statusMap[id]
    },
    parentOf(id) {
      const status = this.statusById(id)
      if (!status) {
        return undefined
      }
      const { in_reply_to_status_id: parentId } = status
      if (!this.statusMap[parentId]) {
        return undefined
      }
      return parentId
    },
    parentOrSelf(id) {
      return this.parentOf(id) || id
    },
    // Ancestors of some status, from top to bottom
    ancestorsOf(id) {
      const ancestors = []
      let cur = this.parentOf(id)
      while (cur) {
        ancestors.unshift(this.statusMap[cur])
        cur = this.parentOf(cur)
      }
      return ancestors
    },
    topLevelAncestorOrSelfId(id) {
      let cur = id
      let parent = this.parentOf(id)
      while (parent) {
        cur = this.parentOf(cur)
        parent = this.parentOf(parent)
      }
      return cur
    },
    resetDisplayState() {
      this.undive()
      this.threadDisplayStatusObject = {}
    },
    onStatusSuspendStateChange({ id, suspend }) {
      if (!suspend) {
        this.unsuspendibleIds.add(id)
      } else {
        this.unsuspendibleIds.delete(id)
      }
    },
    onPosted(data) {
      this.explicitReplyStatus = null
      if (this.isPage) {
        this.$router.push({ name: 'conversation', params: { id: data.id } })
      }
    },
  },
}

export default conversation
