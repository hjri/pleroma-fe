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
         gliter: 0,
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
         this.gliter++
         const iter = this.gliter
         this.fetchPage(this.$store, {
            page: this.pageIndex++,
            pageSize: this.pageSize
         }).then((items) => {
            // ignore if another request was already dispatched
            if (iter == this.gliter) {
               console.log('items', items)
               this.items = [...this.items, ...items]
            }
         })
      },
      selected () {
         return this.$refs.list.selected
      }
   },
   mounted () {
      this.reset()
   }
}
export default PageList
