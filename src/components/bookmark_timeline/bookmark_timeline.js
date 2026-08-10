import Timeline from 'src/components/timeline/timeline.vue'

import { useStatusesStore } from 'src/stores/statuses.js'

const Bookmarks = {
  created() {
    useStatusesStore().clearTimeline({ timeline: 'bookmarks' })
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
      useStatusesStore().clearTimeline({ timeline: 'bookmarks' })
      this.$store.dispatch('stopFetchingTimeline', 'bookmarks')
      this.$store.dispatch('startFetchingTimeline', {
        timeline: 'bookmarks',
        bookmarkFolderId: this.folderId || null,
      })
    },
  },
  unmounted() {
    useStatusesStore().clearTimeline({ timeline: 'bookmarks' })
    this.$store.dispatch('stopFetchingTimeline', 'bookmarks')
  },
}

export default Bookmarks
