import { get } from 'lodash-es'
import { storeToRefs } from 'pinia'
import {
  computed,
  nextTick,
  provide,
  ref,
  toRefs,
  useTemplateRef,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import ThreadTree from 'src/components/thread_tree/thread_tree.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'

import { useConversation } from 'src/composables/useConversation.js'
import { useTreeConversationTopology } from 'src/composables/useTreeConversationTopology.js'
import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'

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

export default {
  props: {
    statusId: {
      // Main thing
      type: String,
      required: true,
    },
    isPage: {
      // Whether conversation is rendered as a standalone page
      // as opposed to embedded into a timeline
      type: Boolean,
      default: false,
    },
  },
  components: {
    ThreadTree,
    QuickFilterSettings,
    QuickViewSettings,
    ChatMessageList,
    PostStatusForm,
    RichContent,
  },
  setup(props) {
    // # Helpers
    const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)
    const getConversationId = (statusId) => {
      const status = getStatusObject(statusId)
      return get(
        status,
        'retweeted_status.statusnet_conversation_id',
        get(status, 'statusnet_conversation_id'),
      )
    }

    const { statusId } = toRefs(props)

    const router = useRouter()

    // # Main Configuration / global state
    const { mergedConfig } = storeToRefs(useMergedConfigStore())
    const { mastoUserSocketStatus } = storeToRefs(useStreamingStore())
    const displayStyle = computed(() => mergedConfig.value.conversationDisplay)
    const streamingEnabled = computed(
      () =>
        mergedConfig.value.useStreamingApi &&
        mastoUserSocketStatus === WSConnectionStatus.JOINED,
    )
    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')

    // # Conversation Expansion
    const expanded = ref(false)
    const { isPage } = toRefs(props)
    const isExpanded = computed(() => !!(expanded.value || isPage.value))
    const toggleExpanded = () => {
      expanded.value = !expanded.value
    }
    watch(expanded, (value) => {
      if (value) {
        fetchConversation()
      } else {
        resetDisplayState()
      }
    })
    provide('isExpanded', isExpanded)
    provide('isPage', isPage)

    // # Focus
    const focusedId = ref(statusId.value)
    const focused = computed(() => (isExpanded.value ? focusedId.value : null))
    const setFocused = (id) => {
      if (!id) return
      focusedId.value = id

      if (!streamingEnabled.value) {
        useStatusesStore().fetchStatus(id)
      }

      useStatusesStore().fetchFavsAndRepeats(id)
      useStatusesStore().fetchEmojiReactions(id)
    }
    provide('focused', focused)

    // # Main things
    const {
      currentStatus,
      conversation,
      replies,
      getReplies,
      fetchConversation,
      loadError,
    } = useConversation(focusedId, isExpanded)

    const resetDisplayState = () => {
      setFocused(statusId.value)
      resetThreadDisplay()
    }
    watch(statusId, (newVal, oldVal) => {
      const newConversationId = getConversationId(newVal)
      const oldConversationId = getConversationId(oldVal)
      if (
        newConversationId &&
        oldConversationId &&
        newConversationId === oldConversationId
      ) {
        setFocused(newVal)
      } else {
        resetDisplayState()
        fetchConversation()
      }
    })

    // Component created
    if (isPage.value) {
      fetchConversation()
    }

    // # Misc UI things
    const firstStatus = computed(() => conversation.value[0])
    const lastStatus = computed(
      () => conversation.value[conversation.value.legnth - 1],
    )
    const getStatusClasses = (status, active) => ({
      '-first': status.id === firstStatus.value?.id,
      '-last': status.id === lastStatus.value?.id,
    })

    // # Linear style stuff
    const isLinearView = computed(() => displayStyle.value !== 'tree')
    const body = useTemplateRef('body')
    const {
      heightChart: heightChartLinear,
      changeSuspendState: changeSuspendStateLinear,
      updateVirtualHeight: updateVirtualHeightLinear,
    } = useVirtualScrolling(conversation, body)

    // # Tree style stuff
    const isTreeView = computed(() => displayStyle.value === 'tree')
    const {
      topLevel,
      currentAncestors,
      threadDisplay,
      showThreadRecursively,
      resetThreadDisplay,
    } = useTreeConversationTopology(conversation, replies, focusedId)
    provide('threadDisplay', threadDisplay)

    const ancestorsElement = useTemplateRef('ancestors')
    const {
      heightChart: heightChartAncestors,
      changeSuspendState: changeSuspendStateAncestors,
      updateVirtualHeight: updateVirtualHeightAncestors,
    } = useVirtualScrolling(currentAncestors, ancestorsElement)

    const currentLevel = computed(() => [currentStatus.value])
    const currentLevelElement = useTemplateRef('currentLevel')
    const {
      heightChart: heightChartCurrentLevel,
      changeSuspendState: changeSuspendStateCurrentLevel,
      updateVirtualHeight: updateVirtualHeightCurrentLevel,
    } = useVirtualScrolling(currentLevel, currentLevelElement)

    const treeViewIsSimple = computed(
      () => !mergedConfig.value.conversationTreeAdvanced,
    )
    const shouldShowAllConversationButton = computed(
      () => currentAncestors.value.length > 0 && topLevel.value.length > 1,
    )
    const shouldShowAncestors = computed(
      () => isExpanded.value && currentAncestors.value.size > 0,
    )
    const shouldFadeAncestors = computed(
      () => mergedConfig.value.conversationTreeFadeAncestors,
    )
    const shouldShowOtherRepliesButton = computed(
      () => mergedConfig.value.conversationOtherRepliesButton === 'below',
    )

    // # Scrolling
    const tryScrollTo = (id) => {
      if (!id) {
        return
      }
      if (isPage.value) {
        router.push({ name: 'conversation', params: { statusId: id } })
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
      nextTick(() => {
        setFocused(id)
      })
    }
    const diveIntoStatus = (id) => {
      tryScrollTo(id)
    }
    const diveToTopLevel = () => {
      tryScrollTo(currentAncestors.value[0].id)
    }

    return {
      // # Misc
      loadError,
      mobileLayout,

      // # Focus
      focused,
      setFocused,

      // # Main things
      conversation,
      currentStatus,
      getReplies,

      // # Conversation Expansion
      isPage,
      isExpanded,
      toggleExpanded,

      // # Misc UI things
      getStatusClasses,

      // # Linear style stuff
      isLinearView,

      // ## Linear virtual scrolling
      heightChartLinear,
      changeSuspendStateLinear,
      updateVirtualHeightLinear,

      // # Tree style stuff
      isTreeView,

      // ## Tree virtual scrolling
      heightChartAncestors,
      changeSuspendStateAncestors,
      updateVirtualHeightAncestors,
      heightChartCurrentLevel,
      changeSuspendStateCurrentLevel,
      updateVirtualHeightCurrentLevel,

      // ## Tree state
      // ### Topology
      topLevel,
      currentAncestors,

      // ### Thread Display
      showThreadRecursively,

      // ### Derived values and config
      treeViewIsSimple,
      shouldShowAllConversationButton,
      shouldShowAncestors,
      shouldFadeAncestors,
      shouldShowOtherRepliesButton,

      // # Scrolling
      diveToTopLevel,
      diveIntoStatus,
    }
  },
}
