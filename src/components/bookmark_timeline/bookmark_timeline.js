import Timeline from 'src/components/timeline/timeline.vue'

const Bookmarks = {
  created() {
    this.$store.commit('clearTimeline', { timeline: 'bookmarks' })
    this.$store.dispatch('startFetchingTimeline', {
      timeline: 'bookmarks',
      bookmarkFolderId: this.folderId || null,
    })
  },
  components: {
    Timeline,
  },
  computed: {
    folderId() {
      return this.$route.params.id
    },
    timeline() {
      return this.$store.state.statuses.timelines.bookmarks
    },
  },
  watch: {
    folderId() {
      this.$store.commit('clearTimeline', { timeline: 'bookmarks' })
      this.$store.dispatch('stopFetchingTimeline', 'bookmarks')
      this.$store.dispatch('startFetchingTimeline', {
        timeline: 'bookmarks',
        bookmarkFolderId: this.folderId || null,
      })
    },
  },
  unmounted() {
    this.$store.commit('clearTimeline', { timeline: 'bookmarks' })
    this.$store.dispatch('stopFetchingTimeline', 'bookmarks')
  },
}

export default Bookmarks
