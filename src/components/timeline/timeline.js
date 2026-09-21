import { debounce, throttle } from 'lodash-es'
import { storeToRefs } from 'pinia'
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRefs,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import Conversation from 'src/components/conversation/conversation.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import ScrollTopButton from 'src/components/scroll_top_button/scroll_top_button.vue'
import TimelineMenu from 'src/components/timeline_menu/timeline_menu.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useTimelinesStore } from 'src/stores/timelines.js'

import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'
import { useScrollPosition } from 'src/composables/useScrollPosition.js'
import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowUp,
  faCheck,
  faCircleNotch,
  faCirclePlus,
  faCog,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch, faCog, faMinus, faArrowUp, faCirclePlus, faCheck)

const Timeline = {
  props: {
    timelineRef: Object,
    footerSlipgate: Object, // reference to an element where we should put our footer
    embedded: Boolean,
    skipPinned: Boolean,
    hideEmpty: Boolean,
  },
  components: {
    ScrollTopButton,
    Conversation,
    TimelineMenu,
    QuickFilterSettings,
    QuickViewSettings,
  },
  setup(props, ctx) {
    const { t } = useI18n()
    const unfocused = ref(false)

    // Timeline
    const { timelineRef } = toRefs(props)
    const timeline = computed(() => useTimelinesStore()[timelineRef.value.name])
    const { skipPinned } = toRefs(props)
    const filteredVisibleStatuses = computed(() => {
      return timeline.value.order
        .filter((id) => timeline.value.visibleStatusIds.has(id))
        .map((id) => useStatusesStore().allStatuses.get(id))
        .filter(({ pinned }) => (skipPinned.value ? !pinned : true))
    })

    // Virtual scrolling
    const { fontSize, navbarSize } = useInterfaceSizes()

    // Placeholder heights.
    const mutedStatusHeight = computed(() => fontSize.value * 1.5)
    const normalStatusHeight = computed(() => fontSize.value * 10)
    const getPlaceholderHeight = (id) =>
      filteredVisibleStatuses.value.find((item) => item.id === id)?.muted
        ? mutedStatusHeight
        : normalStatusHeight

    const body = useTemplateRef('timeline')
    const offset = computed(() => {
      if (embedded.value) {
        // The fontsize after navbar is the little gap between navbar and content
        return navbarSize.value + fontSize.value
      } else {
        return 0
      }
    })
    const { heightChart, changeSuspendState, updateVirtualHeight } =
      useVirtualScrolling({
        name: 'Timeline',
        enabled: ref(true),
        list: filteredVisibleStatuses,
        body,
        offset,
        scrollPositionInstance: useScrollPosition(),
        scrollCompensation: ref(true),
        getPlaceholderHeight,
      })

    // Counter
    const count = computed(() => timeline.value.order.length)
    const newStatusCount = computed(() => timeline.value.newStatusCount)
    const showLoadButton = computed(
      () => timeline.value.newStatusCount > 0 || timeline.value.reloadNeeded,
    )

    // Showing new
    const paused = ref(false)
    watch(newStatusCount, (count) => {
      if (!useMergedConfigStore().mergedConfig.streaming) {
        return
      }
      if (count <= 0) return
      // only 'stream' them when you're scrolled to the top
      const doc = document.documentElement
      const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
      if (
        top < 15 &&
        !paused.value &&
        !(
          unfocused.value &&
          useMergedConfigStore().mergedConfig.pauseOnUnfocused
        )
      ) {
        showNewStatuses()
      } else {
        paused.value = true
      }
    })
    const showNewStatuses = () => {
      if (timeline.value.reloadNeeded) {
        useTimelinesStore().clearTimeline(timelineRef.value.name)
        fetchOlderStatuses()
      } else {
        blockClicksTemporarily()
        useTimelinesStore().showNewStatuses(timelineRef.value.name)
        paused.value = false
      }
      window.scrollTo({ top: 0 })
    }
    const fetchOlderStatuses = throttle(() => {
      timeline.value.fetcher.fetchOlder()
    }, 1000)

    // Timeline change
    const timelineChange = (newTimeline, oldTimeline) => {
      const sameName = newTimeline?.name === oldTimeline?.name
      const sameArgument = newTimeline?.argument === oldTimeline?.argument
      if (sameName && sameArgument) return

      if (oldTimeline) {
        useTimelinesStore().deactivate(oldTimeline.name)
      }
      if (newTimeline) {
        useTimelinesStore().activate(newTimeline.name, newTimeline.argument)
      }
    }
    watch(timelineRef, timelineChange, { immediate: true })
    onUnmounted(() => {
      timelineChange(null, timelineRef.value)
    })

    // Misclick prevention
    const blockingClicks = ref(false)
    const stopBlockingClicks = debounce(() => {
      blockingClicks.value = false
    }, 1000)
    const blockClicksTemporarily = () => {
      if (!blockingClicks.value) {
        blockingClicks.value = true
      }
      stopBlockingClicks()
    }

    // Shortcuts
    const handleShortKey = (e) => {
      // Ignore when input fields are focused
      if (['textarea', 'input'].includes(e.target.tagName.toLowerCase())) return
      if (e.key === '.') showNewStatuses()
    }
    onMounted(() => {
      window.addEventListener('keydown', handleShortKey)
    })
    onUnmounted(() => {
      window.removeEventListener('keydown', handleShortKey)
    })

    // Scroll
    const scrollLoad = () => {
      // TODO simplify this logic
      const bodyBRect = document.body.getBoundingClientRect()
      const height = Math.max(bodyBRect.height, -bodyBRect.y)
      if (
        !timeline.value.fetcher.loadingOlder &&
        window.innerHeight + window.pageYOffset >= height - 750
      ) {
        fetchOlderStatuses()
      }
    }
    const handleScroll = throttle((e) => {
      scrollLoad(e)
    }, 200)
    onMounted(() => {
      window.addEventListener('scroll', handleScroll)
    })
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    // Focused state
    const handleVisibilityChange = () => {
      unfocused.value = document.hidden
    }
    onMounted(() => {
      if (document.hidden === undefined) return
      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
        false,
      )
      unfocused.value = document.hidden
    })
    onUnmounted(() => {
      if (document.hidden === undefined) return
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
        false,
      )
    })

    // Misc UI things
    const classes = computed(() => {
      let rootClasses = !embedded.value
        ? ['panel', 'panel-default']
        : ['-embedded']
      if (blockingClicks.value)
        rootClasses = rootClasses.concat(['-blocked', '_misclick-prevention'])
      return {
        root: rootClasses,
        header: ['timeline-heading'].concat(
          !embedded.value ? ['panel-heading', '-sticky'] : ['panel-body'],
        ),
        body: ['timeline-body'].concat(
          !embedded.value ? ['panel-body'] : ['panel-body'],
        ),
        footer: ['timeline-footer'].concat(
          !embedded.value ? ['panel-footer'] : ['panel-body'],
        ),
      }
    })
    const loadButtonString = computed(() => {
      if (timeline.value.reloadNeeded) {
        return t('timeline.reload')
      } else {
        return `${t('timeline.show_new')} (${newStatusCount.value})`
      }
    })
    const mobileLoadButtonString = computed(() => {
      if (timeline.value.reloadNeeded) {
        return '+'
      } else {
        return newStatusCount.value > 99 ? '∞' : newStatusCount.value
      }
    })

    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')
    const { footerSlipgate, embedded, hideEmpty } = toRefs(props)

    return {
      timelineRef,
      timeline,
      filteredVisibleStatuses,

      heightChart,
      updateVirtualHeight,
      changeSuspendState,

      count,
      showLoadButton,

      showNewStatuses,
      fetchOlderStatuses,

      classes,
      loadButtonString,
      mobileLoadButtonString,
      mobileLayout,
      footerSlipgate,
      embedded,
      hideEmpty,
    }
  },
}

export default Timeline
