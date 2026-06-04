import Timeline from 'src/components/timeline/timeline.vue'

const QuotesTimeline = {
  created() {
    this.$store.commit('clearTimeline', { timeline: 'quotes' })
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
      this.$store.commit('clearTimeline', { timeline: 'quotes' })
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
