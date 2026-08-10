import Timeline from 'src/components/timeline/timeline.vue'

import { useStatusesStore } from 'src/stores/statuses.js'

const TagTimeline = {
  created() {
    useStatusesStore().clearTimeline({ timeline: 'tag' })
    this.$store.dispatch('startFetchingTimeline', {
      timeline: 'tag',
      tag: this.tag,
    })
  },
  components: {
    Timeline,
  },
  computed: {
    tag() {
      return this.$route.params.tag
    },
    timeline() {
      return this.$store.state.statuses.timelines.tag
    },
  },
  watch: {
    tag() {
      useStatusesStore().clearTimeline({ timeline: 'tag' })
      this.$store.dispatch('startFetchingTimeline', {
        timeline: 'tag',
        tag: this.tag,
      })
    },
  },
  unmounted() {
    this.$store.dispatch('stopFetchingTimeline', 'tag')
  },
}

export default TagTimeline
