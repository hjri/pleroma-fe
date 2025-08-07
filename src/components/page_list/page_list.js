import SelectableList from 'src/components/selectable_list/selectable_list.vue'

const PageList = {
  components: {
    SelectableList
  },
  props: {
    boxOnly: {
      type: Boolean,
      default: false
    },
    pageSize: {
      type: Number,
      default: 50
    },
    fetchPage: {
      type: Function,
      default: async () => []
    },
    singlePage: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      pageIndex: 1,
      items: [],
      canLoadMore: true,
      isLoading: false
    }
  },
  methods: {
    reset () {
      this.canLoadMore = true
      this.pageIndex = 1
      this.items = []
      this.isLoading = false
      this.loadMore() // load one page
    },
    loadMore () {
      if (!this.isLoading && this.canLoadMore) {
        this.isLoading = true
        this.fetchPage(this.$store, {
          page: this.pageIndex++,
          pageSize: this.pageSize
        }).then(items => {
          this.items = [...this.items, ...items]
          this.isLoading = false
        })
      }
    },
    getSelected () {
      return this.$refs.list.selected
    }
  },
  mounted () {
    this.loadMore()
  }
}
export default PageList
