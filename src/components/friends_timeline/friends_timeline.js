import Timeline from 'src/components/timeline/timeline.vue'

const FriendsTimeline = {
  components: {
    Timeline,
  },
  computed: {
    timeline() {
      return this.$store.state.statuses.timelines.friends
    },
  },
}

export default FriendsTimeline
