import { debounce } from 'lodash'

import Checkbox from 'src/components/checkbox/checkbox.vue'
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
    url: {
      type: String,
      required: false,
      default: '',
    },
    id: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      text: this.url,
      loading: false,
      error: false,
      debounceSetQuote: debounce((value) => {
        this.fetchStatus(value)
      }, 1000),
    }
  },
  created() {
    if (this.url && !this.id) {
      this.fetchStatus(this.url)
    } else if (this.id) {
      this.text =
        window.location.protocol +
        '//' +
        this.instanceHost +
        '/notice/' +
        this.id
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
      return (!!this.id || this.loading) && !this.error
    },
  },
  watch: {
    text(value) {
      this.debounceSetQuote(value)
      this.$emit('update:url', value)
    },
    visible(value) {
      if (value && this.url) {
        this.fetchStatus(this.url)
      }
    },
  },
  methods: {
    clear() {
      this.text = this.url
      this.loading = false
      this.error = false
    },
    setLoading(value) {
      this.loading = value
    },
    handleError(error) {
      this.id = null
      this.error = !!error
    },
    fetchStatus(value) {
      this.error = false

      const notice = this.noticeRegex.exec(value)
      if (notice && notice.length === 4) {
        this.$emit('update:id', notice[3])
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
              this.$emit('update:id', data.statuses[0].id)
            } else {
              this.handleError(true)
            }
          })
          .catch(this.handleError)
          .finally(() => {
            this.loading = false
          })
      } else {
        this.$emit('update:id', null)
      }
    },
  },
}
