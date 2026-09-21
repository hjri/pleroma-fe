import { last } from 'lodash-es'
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

import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import ThreadTree from 'src/components/thread_tree/thread_tree.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { useClientRectSize } from 'src/composables/useClientRectSize.js'
import { useConversation } from 'src/composables/useConversation.js'
import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'
import { useTreeConversationTopology } from 'src/composables/useTreeConversationTopology.js'
import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'
import { useWindowScroll } from 'src/composables/useWindowScroll.js'

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
    RichContent,
  },
  emits: ['heightChange', 'suspendableStateChange', 'expanded', 'collapsed'],
  setup(props, { emit }) {
    const scroller = useWindowScroll()
    const { statusId } = toRefs(props)

    // # Main Configuration / global state
    const { mergedConfig } = storeToRefs(useMergedConfigStore())
    const displayStyle = computed(() => mergedConfig.value.conversationDisplay)
    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')

    // # Conversation Expansion
    const expanded = ref(false)
    const { isPage } = toRefs(props)
    const isExpanded = computed(() => !!(expanded.value || isPage.value))
    const toggleExpanded = async () => {
      const newVal = !expanded.value
      if (newVal) {
        virtualScrollingEnabled.value = newVal
        await nextTick()
        expanded.value = newVal
      } else {
        expanded.value = newVal
        await nextTick()
        virtualScrollingEnabled.value = newVal
      }
    }
    provide('isExpanded', isExpanded)
    provide('isPage', isPage)
    provide('expandable', true)
    watch(expanded, (val) => (val ? emit('expanded') : emit('collapsed')), {
      flush: 'post',
    })

    // # Main things
    const {
      focusedId,
      conversationId,
      setFocused,
      currentStatus,
      conversation,
      replies,
      getReplies,
      fetchConversation,
      loadError,
    } = useConversation(statusId, isExpanded)
    const conversationLite = computed(() =>
      conversation.value.map(({ id }) => ({ id })),
    )
    provide('focusedId', focusedId)
    provide('conversation', conversation)
    provide('replies', replies)

    // Component created
    if (isPage.value) {
      fetchConversation()
    }

    // # Misc UI things
    const firstStatus = computed(() => conversation.value[0])
    const lastStatus = computed(() => last(conversation.value))
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

    // # External virtual scrolling
    const unsuspendableIds = ref(new Set())
    const suspendable = computed(
      () => !isExpanded.value && unsuspendableIds.value.size === 0,
    )
    const rootElement = useTemplateRef('root')
    const rootElementMargin = ref(null)
    const { height } = useClientRectSize(rootElement)
    watch(height, (value) => {
      const rootCss = window.getComputedStyle(rootElement.value)
      const rootMarginString = rootCss.getPropertyValue('margin-top')
      const rootMargin = Number.parseInt(rootMarginString.slice(0, -2), 10)
      rootElementMargin.value = rootMargin

      emit('heightChange', {
        id: statusId.value,
        height: value,
        element: rootElement,
      })
    })

    watch(suspendable, (value) =>
      emit('suspendableStateChange', {
        suspendable: value,
        id: statusId.value,
      }),
    )

    // # Internal virtual scrolling
    const virtualScrollingEnabled = ref(isExpanded.value)

    // Placeholder heights.
    const { fontSize, navbarSize, panelHeaderSize } = useInterfaceSizes()
    const normalStatusHeight = computed(() => fontSize.value * 10)
    const getPlaceholderHeight = (id) => normalStatusHeight
    const offset = computed(() => {
      // The fontsize after navbar is the little gap between navbar and content
      if (isPage.value) {
        return navbarSize.value + fontSize.value + panelHeaderSize.value
      } else if (expanded.value) {
        return (
          navbarSize.value +
          fontSize.value +
          panelHeaderSize.value * 2 +
          rootElementMargin.value
        )
      } else {
        return navbarSize.value + fontSize.value
      }
    })

    // # Linear style stuff
    const isLinearView = computed(() => displayStyle.value !== 'tree')
    const linearElement = useTemplateRef('linear')
    const linearScrollCompensation = computed(
      () => virtualScrollingEnabled.value && isLinearView.value,
    )
    const {
      heightChart: heightChartLinear,
      changeSuspendState: changeSuspendStateLinear,
      updateVirtualHeight: updateVirtualHeightLinear,
      reset: resetLinearScrollVirtualization,
      scrollTo: linearScrollTo,
    } = useVirtualScrolling({
      name: 'Linear',
      enabled: linearScrollCompensation,
      list: conversationLite,
      body: linearElement,
      offset,
      scrollPositionInstance: scroller,
      scrollCompensation: linearScrollCompensation,
      getPlaceholderHeight,
    })
    const changeSuspendStateLinearLocal = (e) => {
      changeSuspendStateLinear(e)
      const { id, suspendable } = e
      if (suspendable) {
        unsuspendableIds.value.delete(id)
      } else {
        unsuspendableIds.value.add(id)
      }
    }

    // # Tree style stuff
    const isTreeView = computed(() => displayStyle.value === 'tree')
    const {
      topLevel,
      currentAncestors,
      threadDisplay,
      setThreadDisplayRecursively,
      showThreadRecursively,
      resetThreadDisplay,
      totalReplyCount,
      totalReplyDepth,
    } = useTreeConversationTopology(conversation, replies, focusedId)
    provide('threadDisplay', threadDisplay)
    provide('totalReplyCount', totalReplyCount)
    provide('totalReplyDepth', totalReplyDepth)
    watch(
      isExpanded,
      (value) => {
        if (!value) resetThreadDisplay()
      },
      { flush: 'post' },
    )

    const toggleThreadDisplay = (id) => {
      const current = threadDisplay.value.get(id)
      const next = current === 'hidden' ? 'showing' : 'hidden'
      setThreadDisplayRecursively(id, next)
    }

    const currentAncestorsLite = computed(() =>
      currentAncestors.value.map(({ id }) => ({ id })),
    )
    const ancestorsElement = useTemplateRef('ancestors')
    const treeScrollCompensation = computed(
      () => virtualScrollingEnabled.value && isTreeView.value,
    )
    const {
      heightChart: heightChartAncestors,
      changeSuspendState: changeSuspendStateAncestors,
      updateVirtualHeight: updateVirtualHeightAncestors,
      reset: resetTreeScrollVirtualization,
    } = useVirtualScrolling({
      name: 'Ancestors',
      enabled: treeScrollCompensation,
      list: currentAncestorsLite,
      body: ancestorsElement,
      offset,
      scrollPositionInstance: scroller,
      scrollCompensation: treeScrollCompensation,
      collapseMode: 'height',
      getPlaceholderHeight,
    })
    const changeSuspendStateAncestorsLocal = (e) => {
      changeSuspendStateAncestors(e)
      const { id, suspendable } = e
      if (suspendable) {
        unsuspendableIds.value.delete(id)
      } else {
        unsuspendableIds.value.add(id)
      }
    }
    const changeSuspendStateCurrentLevelLocal = (e) => {
      const { id, suspendable } = e
      if (suspendable) {
        unsuspendableIds.value.delete(id)
      } else {
        unsuspendableIds.value.add(id)
      }
    }

    watch(conversationId, (neu, old) => {
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
    const scrollTo = (ids) => {
      if (isLinearView.value) {
        return linearScrollTo(ids)
      }
    }
    const diveIntoStatus = (id) => setFocused(id)
    const diveToTopLevel = () => setFocused(currentAncestors.value[0].id)

    watch(focusedId, async (neu, old) => {
      // Ignoring initial update (null -> id) since that is handled by scroll compensation
      if (old && neu) scrollTo(new Set([neu]))
    })

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
      toggleThreadDisplay,

      // ### Derived values and config
      treeViewIsSimple,
      shouldShowAllConversationButton,
      shouldShowAncestors,

      // # Scrolling
      diveToTopLevel,
      diveIntoStatus,
      unsuspendableIds,
    }
  },
}
