import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

export default {
  components: {},
  name: 'Quote',
  props: {
    visible: {
      type: Boolean,
    },
    loading: {
      type: Boolean,
    },
    statusId: {
      type: String,
    },
    statusUrl: {
      type: String,
    },
    statusVisible: {
      type: Boolean,
    },
    initiallyExpanded: {
      type: Boolean,
    },
  },
  data() {
    return {
      displayQuote: this.initiallyExpanded,
      fetchAttempted: false,
      fetching: false,
      error: null,
    }
  },
  created() {
    this.maybeFetchStatus()
  },
  watch: {
    statusId() {
      this.maybeFetchStatus()
    },
  },
  computed: {
    quotedStatus() {
      return this.statusId
        ? this.$store.state.statuses.allStatusesObject[this.statusId]
        : undefined
    },
    shouldDisplayQuote() {
      return this.displayQuote && this.quotedStatus
    },
    hasVisibleQuote() {
      return (
        this.statusUrl &&
        this.statusVisible &&
        (this.showSpinner || this.quotedStatus)
      )
    },
    hasInvisibleQuote() {
      return this.statusUrl && !this.statusVisible
    },
    showSpinner() {
      return this.loading || this.fetching
    },
  },
  methods: {
    toggleDisplayQuote() {
      this.displayQuote = !this.displayQuote
      this.maybeFetchStatus()
    },
    maybeFetchStatus() {
      if (this.statusId && this.displayQuote && !this.quotedStatus) {
        this.fetchStatus()
      }
    },
    fetchStatus() {
      this.fetchAttempted = true
      this.fetching = true
      this.$emit('loading', true)
      this.$store
        .dispatch('fetchStatus', this.statusId)
        .then(() => {
          this.displayQuote = true
        })
        .catch((error) => {
          this.error = error
          this.$emit('error', error)
        })
        .finally(() => {
          this.fetching = false
          this.$emit('loading', false)
        })
    },
  },
}
