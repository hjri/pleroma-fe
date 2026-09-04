import { debounce, throttle } from 'lodash-es'
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
    inProfile: Boolean,
    skipPinned: Boolean,
    hideEmpty: Boolean,
  },
  data() {
    return {
      showScrollTop: false,
      paused: false,
      unfocused: false,
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
      return this.timeline.order
        .filter((id) => this.timeline.visibleStatusIds.has(id))
        .map((id) => useStatusesStore().allStatuses.get(id))
        .filter(({ pinned }) => (this.skipPinned ? !pinned : true))
    },
    count() {
      return this.timeline.order.length
    },
    newStatusCount() {
      return this.timeline.newStatusCount
    },
    showLoadButton() {
      return this.timeline.newStatusCount > 0 || this.timeline.reloadNeeded
    },
    loadButtonString() {
      if (this.timeline.reloadNeeded) {
        return this.$t('timeline.reload')
      } else {
        return `${this.$t('timeline.show_new')} (${this.newStatusCount})`
      }
    },
    mobileLoadButtonString() {
      if (this.timeline.reloadNeeded) {
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
    statusesToDisplay() {
      return new Set(this.filteredVisibleStatuses.map(({ id }) => id))
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
  },
  unmounted() {
    this.timelineChange(null, this.timelineRef)
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
      const sameName = newTimeline?.name === oldTimeline?.name
      const sameArgument = newTimeline?.argument === oldTimeline?.argument
      if (sameName && sameArgument) return

      if (oldTimeline) {
        useTimelinesStore().deactivate(oldTimeline.name)
      }
      if (newTimeline) {
        useTimelinesStore().activate(newTimeline.name, newTimeline.argument)
      }
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
      if (this.timeline.reloadNeeded) {
        useTimelinesStore().clearTimeline(this.timelineRef.name)
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
        this.timeline.fetcher.fetchOlder()
      },
      1000,
      this,
    ),
    scrollLoad() {
      // TODO simplify this logic
      const bodyBRect = document.body.getBoundingClientRect()
      const height = Math.max(bodyBRect.height, -bodyBRect.y)
      if (
        !this.timeline.fetcher.loadingOlder &&
        window.innerHeight + window.pageYOffset >= height - 750
      ) {
        this.fetchOlderStatuses()
      }
    },
    handleScroll: throttle(function (e) {
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
