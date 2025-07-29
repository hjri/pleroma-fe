import SelectableList from 'src/components/selectable_list/selectable_list.vue'

const PageList = {
  components: {
    SelectableList
  },
  props: {
    box_only: {
      type: Boolean,
      default: false
    },
    page_size: {
      type: Number,
      default: 50
    },
    fetch_page: {
      type: Function,
      default: async () => []
    },
    single_page: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      page_index: 1,
      items: [],
      can_load_more: true,
      is_loading: false
    }
  },
  methods: {
    reset () {
      this.can_load_more = true
      this.page_index = 1
      this.items = []
      this.is_loading = false
      this.load_more() // load one page
    },
    load_more () {
      if (!this.is_loading && this.can_load_more) {
        this.is_loading = true
        this.fetch_page(this.$store, {
          page: this.page_index++,
          page_size: this.page_size
        }).then(items => {
          this.items = [...this.items, ...items]
          this.is_loading = false
        })
      }
    },
    selected () {
      return this.$refs.list.selected
    }
  },
  mounted () {
    this.load_more()
  }
}
export default PageList
