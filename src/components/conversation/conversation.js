import { get } from 'lodash-es'
import { storeToRefs } from 'pinia'
import {
  computed,
  nextTick,
  onMounted,
  provide,
  ref,
  toRefs,
  useTemplateRef,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import { useScrollPosition } from 'src/components/conversation/useScrollPosition.js'
import { useWindowSize } from 'src/components/conversation/useWindowSize.js'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import ThreadTree from 'src/components/thread_tree/thread_tree.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'

import {
  fetchConversation as apiFetchConversation,
  fetchStatus as apiFetchStatus,
} from 'src/api/public.js'
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
    const { statusId } = toRefs(props)

    const router = useRouter()

    // # Main Configuration
    const { mergedConfig } = storeToRefs(useMergedConfigStore())
    const { mastoUserSocketStatus } = storeToRefs(useStreamingStore())
    const displayStyle = computed(() => mergedConfig.value.conversationDisplay)
    const streamingEnabled = computed(
      () =>
        mergedConfig.value.useStreamingApi &&
        mastoUserSocketStatus === WSConnectionStatus.JOINED,
    )

    // # Misc
    const loadStatusError = ref(null)
    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')

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
    const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)
    const getConversationId = (statusId) => {
      const status = getStatusObject(statusId)
      return get(
        status,
        'retweeted_status.statusnet_conversation_id',
        get(status, 'statusnet_conversation_id'),
      )
    }
    const status = computed(() => getStatusObject(focusedId.value))

    const fetchConversation = async () => {
      if (status.value) {
        const {
          data: { ancestors, descendants },
          timestamp,
        } = await apiFetchConversation({
          id: statusId.value,
          credentials: useOAuthStore().token,
        })

        useStatusesStore().addNewStatuses({ statuses: ancestors, timestamp })
        useStatusesStore().addNewStatuses({
          statuses: descendants,
          timestamp,
        })
      } else {
        try {
          loadStatusError.value = null

          const { data: status } = await apiFetchStatus({
            id: statusId.value,
            credentials: useOAuthStore().token,
          })

          useStatusesStore().addNewStatuses({ statuses: [status] })
          fetchConversation()
        } catch (error) {
          console.error(error)
          loadStatusError.value = error
        }
      }
    }
    const resetDisplayState = () => {
      setFocused(statusId.value)
      threadDisplay.value = new Map()
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
    const conversationId = computed(() => getConversationId(statusId.value))
    const conversation = computed(() => {
      if (!status.value) {
        return []
      }

      if (!isExpanded.value) {
        return [status.value]
      }

      const conversation = useStatusesStore().conversations.get(
        conversationId.value,
      )

      return [...conversation.keys()]
        .map((k) => useStatusesStore().allStatuses.get(k))
        .filter((status) => status.type != 'repeat') // Old backend behavior?
        .toSorted(sortById)
    })
    const replies = computed(() =>
      conversation.value.reduce(
        (result, { id, in_reply_to_status_id: irid }, index) => {
          if (irid) {
            if (!result.has(irid)) {
              result.set(irid, new Set())
            }
            result.get(irid).add({
              name: `#${index}`,
              id,
            })
          }
          return result
        },
        new Map(),
      ),
    )
    const getReplies = (id) => replies.value.get(id) ?? new Set()
    const statusReplies = computed(() => {
      return getReplies(status.value.id)
    })

    provide('conversation', conversation)
    provide('replies', replies)

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

    // Component created
    if (isPage.value) {
      fetchConversation()
    }

    // # Virtual scrolling stuff
    const fontSizeSetting = computed(() => mergedConfig.value.textSize)
    const fontSize = computed(() => {
      // reading fontSizeSetting to make computed react to it
      fontSizeSetting.value
      const string = window
        .getComputedStyle(document.body)
        .getPropertyValue('font-size')
      return Number.parseInt(string.slice(0, -2), 10) // remove the 'px'
    })
    const mutedStatusHeight = computed(() => {
      return fontSize.value * 1.5
    })
    const normalStatusHeight = computed(() => {
      return fontSize.value * 10
    })
    const heights = ref(new Map())
    const totalHeight = computed(() =>
      conversation.value.reduce((acc, item) => {
        if (heights.value.has(item.id)) {
          return acc + heights.value.get(item.id)
        } else if (item.muted) {
          return acc + mutedStatusHeight.value
        } else {
          return acc + normalStatusHeight.value
        }
      }, 0),
    )

    const body = useTemplateRef('body')
    const updateVirtualHeight = ({ id, height }) => {
      heights.value.set(id, height)
    }

    const { y: topScrollBoundary } = useScrollPosition()
    const { height: windowHeight } = useWindowSize()

    const realTopScrollBoundary = ref(0)
    const realBottomScrollBoundary = ref(0)
    const updateBoundaries = () => {
      if (!body.value) return // Not mounted yet

      const { top } = body.value.getBoundingClientRect()

      const distanceItemTopToWindowTop = 0 - top
      const distanceItemTopToWindowBottom = windowHeight.value - top

      realTopScrollBoundary.value = distanceItemTopToWindowTop
      realBottomScrollBoundary.value = distanceItemTopToWindowBottom
    }

    watch(topScrollBoundary, updateBoundaries)
    watch(totalHeight, updateBoundaries)
    onMounted(updateBoundaries)

    const buffer = normalStatusHeight.value * 2

    const unsuspendibleIds = ref(new Set())
    const onStatusSuspendStateChange = ({ id, suspend }) => {
      if (!suspend) {
        unsuspendibleIds.value.add(id)
      } else {
        unsuspendibleIds.value.delete(id)
      }
    }

    const heightChartLinear = computed(() => {
      // Map every height and suspendable state
      const chart = conversation.value.map(({ id }) => {
        const status = getStatusObject(id)
        const height =
          (() => {
            if (heights.value.has(id)) {
              return heights.value.get(id)
            } else if (status?.muted) {
              return mutedStatusHeight.value
            } else {
              return normalStatusHeight.value
            }
          })() + 1 //including border
        const suspendable = !unsuspendibleIds.value.has(id)
        return { id, height, suspendable, status }
      })

      // Walk over the list to set top offsets
      chart.reduce((sum, item) => {
        item.top = sum
        return sum + item.height
      }, 0)

      // Determine visibility state
      chart.forEach((heightChartItem) => {
        const itemBottomBoundary = heightChartItem.top + heightChartItem.height
        const itemTopBoundary = heightChartItem.top

        const finalTopScrollBoundary = realTopScrollBoundary.value - buffer
        const finalBottomScrollBoundary =
          realBottomScrollBoundary.value + buffer

        // console.log(
        //   'TOP SCROLL',
        //   itemBottomBoundary > finalTopScrollBoundary,
        //   itemBottomBoundary, finalTopScrollBoundary,
        // )
        // console.log(
        //   'BOTTOM SCROLL',
        //   itemTopBoundary < finalBottomScrollBoundary,
        //   itemTopBoundary, finalBottomScrollBoundary,
        // )

        // To be visible, item's bottom boundary shoud be below top scroll boundary)
        const belowTopBoundary = itemBottomBoundary > finalTopScrollBoundary
        // To be visible, item's top boundary shoud be above bottom scroll boundary)
        const aboveBottomBoundary = itemTopBoundary < finalBottomScrollBoundary
        // This accounts for the case where item's boundaries exceed scroll boundary

        heightChartItem.visible = belowTopBoundary && aboveBottomBoundary
      })

      // Group invisible statuses into spacers
      return chart.reduce((acc, heightChartItem) => {
        const { suspendable, visible, height, top, bottom, id, status } =
          heightChartItem
        const present = visible || !suspendable
        if (present) {
          return [...acc, { type: 'status', height, top, bottom, id, status }]
        } else {
          const previousItem = acc[acc.length - 1]
          const spacer =
            previousItem?.type === 'spacer'
              ? previousItem
              : {
                  type: 'spacer',
                  top: Number.POSITIVE_INFINITY,
                  bottom: Number.POSITIVE_INFINITY,
                  height: 0,
                  ids: new Set(),
                }

          spacer.ids.add(id)
          spacer.id = [...spacer.ids].join()
          spacer.height += height
          if (top < spacer.top) spacer.top = top
          if (bottom < spacer.bottom) spacer.bottom = bottom

          if (previousItem?.type === 'spacer') {
            return acc
          } else {
            return [...acc, spacer]
          }
        }
      }, [])
    })

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

    // # Tree style stuff
    const isTreeView = computed(() => displayStyle.value === 'tree')

    // ## Tree state
    // ### Topology
    const ancestors = computed(() => {
      // First we fill map with empty sets and add given id's parent
      // as set's only element (if any)
      const parentMap = conversation.value.reduce(
        (result, { id, in_reply_to_status_id: irid }) => {
          if (!result.has(id)) {
            result.set(id, new Set())
          }
          if (irid) {
            // Setting parent for current item
            result.get(id).add(irid)
          }
          return result
        },
        new Map(),
      )

      // Next we iterate over each entry and fill the whole ancestry chain
      parentMap.entries().forEach(([originId, originSet]) => {
        let current = originSet.values().next().value
        while (current) {
          originSet.add(current)

          const parent = parentMap.get(current) ?? new Set()

          current = parent.values().next().value
        }
      })
      return parentMap
    })
    const topLevel = computed(() =>
      [...ancestors.value.entries()]
        .filter(([id, ancestors]) => ancestors.size === 0)
        .map(([id]) => getStatusObject(id)),
    )
    const getAncestorIds = (id) => ancestors.value.get(id) ?? new Set()
    const getAncestors = (id) =>
      [...getAncestorIds(id)].map(getStatusObject).filter(Boolean)
    const currentAncestors = computed(() =>
      getAncestors(focusedId.value).reverse(),
    )
    const currentDepth = computed(() => currentAncestors.value.length)

    // ### Thread Display
    const threadDisplay = ref(new Map()) // id => 'showing' | 'hidden'
    const threadDisplayDefault = computed(() => {
      return conversation.value.reduce((map, status) => {
        const { id } = status
        const depth = ancestors.value.get(id).size

        const state = (() => {
          if (depth - currentDepth.value <= maxDepthToShowByDefault.value) {
            return 'showing'
          } else {
            return 'hidden'
          }
        })()

        map.set(id, state)
        return map
      }, new Map())
    })
    provide('threadDisplay', threadDisplay)
    provide('threadDisplayDefault', threadDisplayDefault)

    const setThreadDisplayRecursively = (id, value) => {
      threadDisplay.value.set(id, value)
      ;[...getReplies(id)]
        .map((k) => k.id)
        .map((id) => setThreadDisplayRecursively(id, value))
    }
    const showThreadRecursively = (id) => {
      setThreadDisplayRecursively(id, 'showing')
    }

    // ## Derived values and config
    const treeViewIsSimple = computed(
      () => !mergedConfig.value.conversationTreeAdvanced,
    )
    const maxDepthToShowByDefault = computed(() => {
      // maxDepthInThread = max number of depths that is *visible*
      // since our depth starts with 0 and "showing" means "showing children"
      // there is a -2 here
      const maxDepth = mergedConfig.value.maxDepthInThread - 2
      return Math.min(1, maxDepth)
    })
    const shouldShowAllConversationButton = computed(
      () => currentAncestors.value.length > 0 && topLevel.value.length > 1,
    )
    const shouldShowAncestors = computed(
      () => isExpanded.value && ancestors.value.get(focusedId.value) != null,
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
      loadStatusError,
      mobileLayout,

      // # Focus
      focused,
      setFocused,

      // # Main things
      status,
      statusReplies,
      getReplies,
      conversation,

      // # Conversation Expansion
      isPage,
      isExpanded,
      toggleExpanded,

      // # Virtual scrolling stuff
      onStatusSuspendStateChange,
      updateVirtualHeight,

      // # Misc UI things
      getStatusClasses,

      // # Linear style stuff
      isLinearView,
      heightChartLinear,

      // # Tree style stuff
      isTreeView,

      // ## Tree state
      // ### Topology
      topLevel,
      currentAncestors,

      // ### Thread Display
      showThreadRecursively,

      // ## Derived values and config
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
