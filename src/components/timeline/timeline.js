import { debounce, throttle } from 'lodash-es'
import { storeToRefs } from 'pinia'
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRefs,
  useId,
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

import { useDocumentFocus } from 'src/composables/useDocumentFocus.js'
import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'
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
    const { mergedConfig } = storeToRefs(useMergedConfigStore())

    const { focused } = useDocumentFocus()
    const unfocused = computed(() => !focused.value)

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

    // Scroll position
    const scroller = inject('bodyScrollPosition')
    const {
      hasReachedTop,
      shouldLoadBottom,
      top: scrollY,
      scrollToPriority,
    } = scroller

    // Pagination
    const paginationEnabled = computed(
      () => mergedConfig.value.timelinePagination,
    )
    const page = ref(0)
    const pageLoading = ref(false)

    const PAGE_SIZE = 20
    const getSlice = (page) => {
      if (paginationEnabled.value) {
        const pageStart = page * PAGE_SIZE
        const pageEnd = pageStart + PAGE_SIZE

        return filteredVisibleStatuses.value.slice(pageStart, pageEnd)
      } else {
        return filteredVisibleStatuses.value
      }
    }

    const currentSlice = computed(() => getSlice(page.value))
    const nextSlice = computed(() => getSlice(page.value + 1))
    const nextSliceReady = computed(() => nextSlice.value.length >= PAGE_SIZE)

    const isFirstPage = computed(() => page.value <= 0)
    const isLastPage = computed(
      () => timeline.value.fetcher.bottomedOut && nextSlice.value.length === 0,
    )

    const nextPage = async () => {
      if (isLastPage.value) return
      try {
        if (!nextSliceReady.value) {
          let attempts = 3 // Prevent accidental infinite loops
          let statusesLoaded = 0
          pageLoading.value = true

          // Until either next slice is full or fetcher bottomed out
          // (leaving less than 20 entries in next slice)
          while (
            !nextSliceReady.value &&
            !timeline.value.fetcher.bottomedOut &&
            attempts > 0
          ) {
            attempts--
            const { statuses } = await timeline.value.fetcher.fetchOlder()
            statusesLoaded += statuses.length

            // Exit early if there's nothing more to load
            // Shouldn't really happen (nextSliceReady should change before this)
            if (statuses.length === 0) break
          }

          if (statusesLoaded === 0) {
            pageLoading.value = false
            return // somehow we got nothing. shouldn't really happen. Abort navigation
          }
        }
      } finally {
        pageLoading.value = false
      }
      page.value++
      scrollToPriority({ top: 0, behavior: 'smooth' })
    }
    const previousPage = () => {
      if (isFirstPage.value) return
      page.value--
      scrollToPriority({ top: 0, behavior: 'smooth' })
    }

    // Virtual scrolling
    const { fontSize, navbarSize } = useInterfaceSizes()

    // Placeholder heights.
    const mutedStatusHeight = computed(() => fontSize.value * 1.5)
    const normalStatusHeight = computed(() => fontSize.value * 10)
    const getPlaceholderHeight = (id) =>
      currentSlice.value.find((item) => item.id === id)?.muted
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
        list: currentSlice,
        body,
        offset,
        scrollPositionInstance: scroller,
        scrollCompensation: true,
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
    const unfocusedPause = computed(
      () => unfocused.value && mergedConfig.value.pauseOnUnfocused,
    )
    const showNewAutomatically = computed(() => mergedConfig.value.streaming)

    watch(newStatusCount, (count) => {
      if (!showNewAutomatically.value) return
      if (count <= 0) return

      // only 'stream' them when you're scrolled to the top
      if (
        hasReachedTop.value &&
        !paused.value &&
        !unfocusedPause.value &&
        page.value === 0
      ) {
        showNewStatuses(true)
      } else {
        paused.value = true
      }
    })

    const showNewStatuses = async (fast = false) => {
      if (timeline.value.reloadNeeded) {
        useTimelinesStore().clearTimeline(timelineRef.value.name)
        fetchOlderStatuses()
      } else {
        blockClicksTemporarily()
        useTimelinesStore().showNewStatuses(timelineRef.value.name)
      }
      page.value = 0
      paused.value = false
      await nextTick()
      scroller.scrollToPriority({
        top: 0,
        behavior: fast ? 'instant' : 'smooth',
      })
    }
    const fetchOlderStatuses = throttle(async () => {
      await timeline.value.fetcher.fetchOlder()
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

      page.value = 0
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

    const infiniteLoadWatcher = debounce(([value]) => {
      if (!value) return
      if (paginationEnabled.value) return
      fetchOlderStatuses()
    }, 100)
    // Scroll
    watch([shouldLoadBottom, scrollY], infiniteLoadWatcher)
    onUnmounted(() => {
      infiniteLoadWatcher.cancel()
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
    const uniqueId = useId()

    return {
      timelineRef,
      timeline,

      paginationEnabled,
      page,
      pageLoading,
      nextPage,
      previousPage,
      isLastPage,
      isFirstPage,

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
      uniqueId,
    }
  },
}

export default Timeline
