import Timeline from 'src/components/timeline/timeline.vue'

import { useStatusesStore } from 'src/stores/statuses.js'

const QuotesTimeline = {
  created() {
    useStatusesStore().clearTimeline({ timeline: 'tag' })
    this.$store.dispatch('startFetchingTimeline', {
      timeline: 'quotes',
      statusId: this.statusId,
    })
  },
  components: {
    Timeline,
  },
  computed: {
    statusId() {
      return this.$route.params.id
    },
    timeline() {
      return this.$store.state.statuses.timelines.quotes
    },
  },
  watch: {
    statusId() {
      useStatusesStore().clearTimeline({ timeline: 'tag' })
      this.$store.dispatch('startFetchingTimeline', {
        timeline: 'quotes',
        statusId: this.statusId,
      })
    },
  },
  unmounted() {
    this.$store.dispatch('stopFetchingTimeline', 'quotes')
  },
}

export default QuotesTimeline
