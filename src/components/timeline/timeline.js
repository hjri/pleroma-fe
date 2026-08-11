import { debounce, keyBy, throttle } from 'lodash'
import { mapState } from 'pinia'

import Conversation from 'src/components/conversation/conversation.vue'
import QuickFilterSettings from 'src/components/quick_filter_settings/quick_filter_settings.vue'
import QuickViewSettings from 'src/components/quick_view_settings/quick_view_settings.vue'
import ScrollTopButton from 'src/components/scroll_top_button/scroll_top_button.vue'
import TimelineMenu from 'src/components/timeline_menu/timeline_menu.vue'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useTimelinesStore } from 'src/stores/timelines.js'
import { useUsersStore } from 'src/stores/users.js'

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
    argument: String,
    embedded: Boolean,
    count: Number,
    pinnedStatusIds: Set,
    inProfile: Boolean,
    footerSlipgate: Object, // reference to an element where we should put our footer
  },
  data() {
    return {
      showScrollTop: false,
      paused: false,
      unfocused: false,
      bottomedOut: false,
      virtualScrollIndex: 0,
      blockingClicks: false,
    }
  },
  components: {
    ScrollTopButton,
    Conversation,
    TimelineMenu,
    QuickFilterSettings,
    QuickViewSettings,
  },
  computed: {
    timeline() {
      return useTimelinesStore()[this.timelineRef.name]
    },
    filteredVisibleStatuses() {
      return [...this.timeline.visibleStatusesIds.keys()]
        .filter(
          (id) =>
            this.timelineRef.name !== 'user' ||
            (id >= this.timeline.minId && id <= this.timeline.maxId),
        )
        .map((id) => this.timeline.statuses.get(id))
    },
    filteredPinnedStatusIds() {
      return (this.pinnedStatusIds || []).filter(
        (statusId) => this.timeline.statusesObject[statusId],
      )
    },
    newStatusCount() {
      return this.timeline.newStatusCount
    },
    showLoadButton() {
      return this.timeline.newStatusCount > 0 || this.timeline.flushMarker !== 0
    },
    loadButtonString() {
      if (this.timeline.flushMarker !== 0) {
        return this.$t('timeline.reload')
      } else {
        return `${this.$t('timeline.show_new')} (${this.newStatusCount})`
      }
    },
    mobileLoadButtonString() {
      if (this.timeline.flushMarker !== 0) {
        return '+'
      } else {
        return this.newStatusCount > 99 ? '∞' : this.newStatusCount
      }
    },
    classes() {
      let rootClasses = !this.embedded
        ? ['panel', 'panel-default']
        : ['-embedded']
      if (this.blockingClicks)
        rootClasses = rootClasses.concat(['-blocked', '_misclick-prevention'])
      return {
        root: rootClasses,
        header: ['timeline-heading'].concat(
          !this.embedded ? ['panel-heading', '-sticky'] : ['panel-body'],
        ),
        body: ['timeline-body'].concat(
          !this.embedded ? ['panel-body'] : ['panel-body'],
        ),
        footer: ['timeline-footer'].concat(
          !this.embedded ? ['panel-footer'] : ['panel-body'],
        ),
      }
    },
    // id map of statuses which need to be hidden in the main list due to pinning logic
    pinnedStatusIdsObject() {
      return keyBy(this.pinnedStatusIds)
    },
    statusesToDisplay() {
      const amount = this.timeline.visibleStatusesIds.size
      const statusesPerSide = Math.ceil(Math.max(3, window.innerHeight / 80))
      const nonPinnedIndex =
        this.virtualScrollIndex - this.filteredPinnedStatusIds.length
      const min = Math.max(0, nonPinnedIndex - statusesPerSide)
      const max = Math.min(amount, nonPinnedIndex + statusesPerSide)
      return new Set(
        [...this.timeline.visibleStatusesIds.keys()].slice(min, max),
      )
    },
    virtualScrollingEnabled() {
      return useMergedConfigStore().mergedConfig.virtualScrolling
    },
    ...mapState(useInterfaceStore, {
      mobileLayout: (store) => store.layoutType === 'mobile',
    }),
  },
  created() {
    this.timelineChange(this.timelineRef)
  },
  mounted() {
    if (document.hidden !== undefined) {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false,
      )
      this.unfocused = document.hidden
    }
    window.addEventListener('keydown', this.handleShortKey)
    window.addEventListener('scroll', this.handleScroll)
    setTimeout(this.determineVisibleStatuses, 250)
  },
  unmounted() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('keydown', this.handleShortKey)
    if (document.hidden !== undefined)
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false,
      )
  },
  methods: {
    timelineChange(newTimeline, oldTimeline) {
      if (oldTimeline && oldTimeline.name !== 'friends') {
        useTimelinesStore().clearTimeline(oldTimeline.name)
      }
      useTimelinesStore().startFetchingTimeline(newTimeline.name, newTimeline.argument)
    },
    stopBlockingClicks: debounce(function () {
      this.blockingClicks = false
    }, 1000),
    blockClicksTemporarily() {
      if (!this.blockingClicks) {
        this.blockingClicks = true
      }
      this.stopBlockingClicks()
    },
    handleShortKey(e) {
      // Ignore when input fields are focused
      if (['textarea', 'input'].includes(e.target.tagName.toLowerCase())) return
      if (e.key === '.') this.showNewStatuses()
    },
    showNewStatuses() {
      if (this.timeline.flushMarker !== 0) {
        useTimelinesStore().clearTimeline(this.timelineRef.name)
        useTimelinesStore().queueFlush(this.timelineRef.name, '')
        this.fetchOlderStatuses()
      } else {
        this.blockClicksTemporarily()
        useTimelinesStore().showNewStatuses(this.timelineRef.name)
        this.paused = false
      }
      window.scrollTo({ top: 0 })
    },
    fetchOlderStatuses: throttle(
      function () {
        this.timeline.fetcher
          .fetchAndUpdate()
          .then(({ statuses }) => {
            if (statuses?.length === 0) {
              this.bottomedOut = true
            }
          })
      },
      1000,
      this,
    ),
    determineVisibleStatuses() {
      if (!this.$refs.timeline) return
      if (!this.virtualScrollingEnabled) return

      const statuses = this.$refs.timeline.children
      const cappedScrollIndex = Math.max(
        0,
        Math.min(this.virtualScrollIndex, statuses.length - 1),
      )

      if (statuses.length === 0) return

      const height = Math.max(document.body.offsetHeight, window.pageYOffset)

      const centerOfScreen = window.pageYOffset + window.innerHeight * 0.5

      // Start from approximating the index of some visible status by using the
      // the center of the screen on the timeline.
      let approxIndex = Math.floor(statuses.length * (centerOfScreen / height))
      let err = statuses[approxIndex].getBoundingClientRect().y

      // if we have a previous scroll index that can be used, test if it's
      // closer than the previous approximation, use it if so

      const virtualScrollIndexY =
        statuses[cappedScrollIndex].getBoundingClientRect().y
      if (Math.abs(err) > virtualScrollIndexY) {
        approxIndex = cappedScrollIndex
        err = virtualScrollIndexY
      }

      // if the status is too far from viewport, check the next/previous ones if
      // they happen to be better
      while (err < -20 && approxIndex < statuses.length - 1) {
        err += statuses[approxIndex].offsetHeight
        approxIndex++
      }
      while (err > window.innerHeight + 100 && approxIndex > 0) {
        approxIndex--
        err -= statuses[approxIndex].offsetHeight
      }

      // this status is now the center point for virtual scrolling and visible
      // statuses will be nearby statuses before and after it
      this.virtualScrollIndex = approxIndex
    },
    scrollLoad() {
      const bodyBRect = document.body.getBoundingClientRect()
      const height = Math.max(bodyBRect.height, -bodyBRect.y)
      if (
        this.timeline.loading === false &&
        this.$el.offsetHeight > 0 &&
        window.innerHeight + window.pageYOffset >= height - 750
      ) {
        this.fetchOlderStatuses()
      }
    },
    handleScroll: throttle(function (e) {
      this.determineVisibleStatuses()
      this.scrollLoad(e)
    }, 200),
    handleVisibilityChange() {
      this.unfocused = document.hidden
    },
  },
  watch: {
    timelineRef(newTimeline, oldTimeline) {
      this.timelineChange(newTimeline, oldTimeline)
    },
    filteredVisibleStatuses() {
      this.determineVisibleStatuses()
    },
    newStatusCount(count) {
      if (!useMergedConfigStore().mergedConfig.streaming) {
        return
      }
      if (count > 0) {
        // only 'stream' them when you're scrolled to the top
        const doc = document.documentElement
        const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0)
        if (
          top < 15 &&
          !this.paused &&
          !(
            this.unfocused &&
            useMergedConfigStore().mergedConfig.pauseOnUnfocused
          )
        ) {
          this.showNewStatuses()
        } else {
          this.paused = true
        }
      }
    },
  },
}

export default Timeline
