import Timeline from 'src/components/timeline/timeline.vue'

const DMs = {
  computed: {
    timeline() {
      return this.$store.state.statuses.timelines.dms
    },
  },
  components: {
    Timeline,
  },
}

export default DMs
