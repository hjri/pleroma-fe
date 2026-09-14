import { storeToRefs } from 'pinia'
import {
  computed,
  onUnmounted,
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

import { useConversation } from 'src/composables/useConversation.js'
import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'
import { useScrollPosition } from 'src/composables/useScrollPosition.js'
import { useTreeConversationTopology } from 'src/composables/useTreeConversationTopology.js'
import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'

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
  emits: ['heightChange', 'suspendableStateChange'],
  setup(props, { emit }) {
    const router = useRouter()
    const scroller = useScrollPosition()

    const tryScrollTo = async (id) => {
      if (!id) {
        return
      }
      if (isPage.value) {
        router.push({ name: 'conversation', params: { statusId: id } })
      }
      setFocused(id)
      const target = document.querySelector(`.Status[data-status-id="${id}"]`)
      return await scroller.scrollIntoView(target, { block: 'nearest' })
    }

    // # Main Configuration / global state
    const { mergedConfig } = storeToRefs(useMergedConfigStore())
    const displayStyle = computed(() => mergedConfig.value.conversationDisplay)
    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')

    // # Conversation Expansion
    const expanded = ref(false)
    const { isPage } = toRefs(props)
    const isExpanded = computed(() => !!(expanded.value || isPage.value))
    const toggleExpanded = () => {
      expanded.value = !expanded.value
    }
    provide('isExpanded', isExpanded)
    provide('isPage', isPage)
    provide('expandable', true)

    // # Main things
    const { statusId } = toRefs(props)
    const {
      focusedId,
      setFocused,
      currentStatus,
      mainStatus,
      conversation,
      replies,
      getReplies,
      fetchConversation,
      loadError,
    } = useConversation(statusId, isExpanded)
    const conversationLite = computed(() =>
      conversation.value.map(({ id }) => ({ id })),
    )

    watch(
      expanded,
      async (value) => {
        if (value) {
          await fetchConversation()
        }
      },
      { flush: 'post' },
    )

    // Component created
    if (isPage.value) {
      fetchConversation()
    }

    // # Misc UI things
    const firstStatus = computed(() => conversation.value[0])
    const lastStatus = computed(
      () => conversation.value[conversation.value.legnth - 1],
    )
    const getStatusClasses = (statusId, ancestor) => {
      const result = {
        '-first': statusId === firstStatus.value?.id,
        '-last': statusId === lastStatus.value?.id,
      }
      if (ancestor) {
        result['-ancestor'] = true
        result['-fade'] = mergedConfig.value.conversationTreeFadeAncestors
      }
      return result
    }

    // External virtual scrolling
    const unsuspendableIds = ref(new Set())
    const suspendable = computed(
      () => !isExpanded.value && unsuspendableIds.value.size === 0,
    )
    const rootElement = useTemplateRef('root')
    const updateVirtualHeight = (e) => {
      const [entry] = e
      emit('heightChange', {
        id: statusId.value,
        height: entry.contentRect.height,
        element: rootElement,
      })
    }
    const resizeObserver = ref(new ResizeObserver(updateVirtualHeight))
    watch(rootElement, () => resizeObserver.value.observe(rootElement.value))
    watch(suspendable, (value) =>
      emit('suspendableStateChange', { suspend: value, id: statusId.value }),
    )
    onUnmounted(() => resizeObserver.value.disconnect())

    // Placeholder heights.
    const { fontSize } = useInterfaceSizes()
    const mutedStatusHeight = computed(() => fontSize.value * 1.5)
    const normalStatusHeight = computed(() => fontSize.value * 10)
    const getPlaceholderHeight = (id) =>
      conversation.value.find((item) => item.id === id)?.muted
        ? mutedStatusHeight
        : normalStatusHeight

    const anchorIds = computed(
      () => new Set([mainStatus.value?.id, currentStatus.value?.id]),
    )

    // # Linear style stuff
    const isLinearView = computed(() => displayStyle.value !== 'tree')
    const linearElement = useTemplateRef('linear')
    const linearScrollCompensation = computed(
      () => isExpanded.value && isLinearView.value,
    )
    const {
      heightChart: heightChartLinear,
      changeSuspendState: changeSuspendStateLinear,
      updateVirtualHeight: updateVirtualHeightLinear,
      reset: resetLinearScrollVirtualization,
    } = useVirtualScrolling({
      context: statusId,
      list: conversationLite,
      body: linearElement,
      scrollPositionInstance: scroller,
      scrollCompensation: linearScrollCompensation,
      anchorIds,
      collapseMode: 'item',
      getPlaceholderHeight,
    })
    const changeSuspendStateLinearLocal = (e) => {
      changeSuspendStateLinear(e)
      const { id, suspend } = e
      if (suspend) {
        unsuspendableIds.value.add(id)
      } else {
        unsuspendableIds.value.delete(id)
      }
    }

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
    watch(
      isExpanded,
      (value) => {
        if (!value) resetThreadDisplay()
      },
      { flush: 'post' },
    )

    const currentAncestorsLite = computed(() =>
      currentAncestors.value.map(({ id }) => ({ id })),
    )
    const ancestorsElement = useTemplateRef('ancestors')
    const treeScrollCompensation = computed(
      () => isExpanded.value && isTreeView.value,
    )
    const {
      heightChart: heightChartAncestors,
      changeSuspendState: changeSuspendStateAncestors,
      updateVirtualHeight: updateVirtualHeightAncestors,
      reset: resetTreeScrollVirtualization,
    } = useVirtualScrolling({
      context: statusId,
      list: currentAncestorsLite,
      body: ancestorsElement,
      scrollPositionInstance: scroller,
      scrollCompensation: treeScrollCompensation,
      collapseMode: 'height',
      getPlaceholderHeight,
    })
    const changeSuspendStateAncestorsLocal = (e) => {
      changeSuspendStateAncestors(e)
      const { id, suspend } = e
      if (suspend) {
        unsuspendableIds.value.add(id)
      } else {
        unsuspendableIds.value.delete(id)
      }
    }
    const changeSuspendStateCurrentLevelLocal = (e) => {
      changeSuspendStateLinear(e)
      const { id, suspend } = e
      if (suspend) {
        unsuspendableIds.value.add(id)
      } else {
        unsuspendableIds.value.delete(id)
      }
    }

    watch(statusId, (neu, old) => {
      resetLinearScrollVirtualization()
      resetTreeScrollVirtualization()
    })

    const treeViewIsSimple = computed(
      () => !mergedConfig.value.conversationTreeAdvanced,
    )
    const shouldShowAllConversationButton = computed(
      () => currentAncestors.value.length > 0 && topLevel.value.length > 1,
    )
    const shouldShowAncestors = computed(
      () => isExpanded.value && heightChartAncestors.value.length > 0,
    )

    // # Scrolling
    const diveIntoStatus = (id) => tryScrollTo(id)
    const diveToTopLevel = () => tryScrollTo(currentAncestors.value[0].id)

    return {
      // # Misc
      loadError,
      mobileLayout,

      // # Conversation Expansion
      isPage,
      isExpanded,
      toggleExpanded,

      // # Focus
      focusedId,
      setFocused,

      // # Main things
      conversation,
      currentStatus,
      getReplies,

      // # Misc UI things
      getStatusClasses,

      // # Linear style stuff
      isLinearView,

      // ## Linear virtual scrolling
      heightChartLinear,
      changeSuspendStateLinearLocal,
      updateVirtualHeightLinear,

      // # Tree style stuff
      isTreeView,

      // ## Tree virtual scrolling
      heightChartAncestors,
      changeSuspendStateAncestorsLocal,
      updateVirtualHeightAncestors,

      changeSuspendStateCurrentLevelLocal,

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

      // # Scrolling
      diveToTopLevel,
      diveIntoStatus,
    }
  },
}
