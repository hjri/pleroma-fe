import { debounce } from 'lodash'

import Checkbox from '../checkbox/checkbox.vue'
import Quote from './quote.vue'

import { useInstanceStore } from 'src/stores/instance.js'

export default {
  components: {
    Quote,
    Checkbox,
  },
  name: 'QuoteForm',
  props: {
    visible: {
      type: Boolean,
    },
    reply: {
      type: Boolean,
    },
    params: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      text: this.params.url,
      loading: false,
      error: false,
      debounceSetQuote: debounce((value) => {
        this.fetchStatus(value)
      }, 1000),
    }
  },
  created() {
    if (this.params.url && !this.params.id) {
      this.fetchStatus(this.params.url)
    } else if (this.params.id) {
      this.text =
        window.location.protocol +
        '//' +
        this.instanceHost +
        '/notice/' +
        this.params.id
      this.params.url = this.text
    }
  },
  computed: {
    instanceHost() {
      return new URL(useInstanceStore().server).host
    },
    noticeRegex() {
      return new RegExp(
        `^([^/:]*:?//|)(${window.location.host}|${this.instanceHost})/notice/(.*)$`,
      )
    },
    quoteVisible() {
      return (!!this.params.id || this.loading) && !this.error
    },
  },
  watch: {
    text(value) {
      this.debounceSetQuote(value)
    },
    visible(value) {
      if (value && this.params.url) {
        this.fetchStatus(this.params.url)
      }
    },
  },
  methods: {
    clear() {
      this.text = this.params.url
      this.loading = false
      this.error = false
    },
    setLoading(value) {
      this.loading = value
    },
    handleError(error) {
      this.params.id = null
      this.error = !!error
    },
    fetchStatus(value) {
      this.params.url = value
      this.error = false

      const notice = this.noticeRegex.exec(value)
      if (notice && notice.length === 4) {
        this.params.id = notice[3]
      } else if (value) {
        this.loading = true
        this.$store
          .dispatch('search', {
            q: value,
            resolve: true,
            offset: 0,
            limit: 1,
            type: 'statuses',
          })
          .then((data) => {
            if (data && data.statuses && data.statuses.length === 1) {
              this.params.id = data.statuses[0].id
            } else {
              this.handleError(true)
            }
          })
          .catch(this.handleError)
          .finally(() => {
            this.loading = false
          })
      } else {
        this.params.id = null
      }
    },
  },
}
