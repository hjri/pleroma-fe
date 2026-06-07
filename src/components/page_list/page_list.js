import SelectableList from 'src/components/selectable_list/selectable_list.vue'

const PageList = {
  components: {
    SelectableList,
  },
  props: {
    /**
     * only make the checkbox clickable to toggle, not the whole area
     */
    boxOnly: {
      type: Boolean,
      default: false,
    },
    /**
     * how many entries to fetch at once
     */
    pageSize: {
      type: Number,
      default: 50,
    },
    /**
     * the function/callback used to fetch new entries (one page)
     */
    fetchPage: {
      type: Function,
      default: async () => [],
    },
    /**
     * wether or not this is a single page list (so it won't allow fetching more pages)
     */
    singlePage: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      pageIndex: 1,
      items: [],
      canLoadMore: true,
      isLoading: false,
    }
  },
  methods: {
    /**
     * reset and load first page
     */
    reset() {
      this.canLoadMore = true
      this.pageIndex = 1
      this.items = []
      this.isLoading = false
      this.loadMore() // load one page
    },
    /**
     * load another page
     */
    loadMore() {
      if (!this.isLoading && this.canLoadMore) {
        this.isLoading = true
        console.log('is loading = true')
        this.fetchPage(this.$store, {
          page: this.pageIndex++,
          pageSize: this.pageSize,
        }).then((items) => {
          this.items = [...this.items, ...items]
          this.isLoading = false
        })
      }
    },
    /**
     * get currently selected elements
     * @returns {Array}
     */
    getSelected() {
      return this.$refs.list.selected
    },
  },
  /**
   * auto-load first page when mounted
   */
  mounted() {
    this.loadMore()
  },
}
export default PageList
