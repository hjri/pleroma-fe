//import Checkbox from 'src/components/checkbox/checkbox.vue'
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
      }
   },
   data () {
      return {
         pageIndex: 1,
         items: [],
         selected: [],
         canLoadMore: true
      }
   },
   methods: {
      reset () {
         this.canLoadMore = true
         this.pageIndex = 1
         this.items = []
         this.loadMore() // load one page
      },
      loadMore () {
         this.fetchPage(this.$store, {
            page: this.pageIndex++,
            pageSize: this.pageSize
         }).then((items) => this.items = [...this.items, ...items])
         // fetch page, add to items
         //this.$forceUpdate()
      }
   },
   mounted () {
      this.reset()
   }
}
export default PageList
