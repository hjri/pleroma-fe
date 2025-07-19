//import get from 'lodash/get'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
import PageList from 'src/components/page_list/page_list.vue'



const UsersTab = {
   provide () {
      return {
         defaultDraftMode: true,
         defaultSource: 'admin'
      }
   },
   data() {
      return {
         filters: {
            local: false,
            external: false,
            active: false,
            need_approval: false,
            unconfirmed: false,
            deactivated: false,
            is_admin: false,
            is_moderator: false
         },
         expandedUser: null,
         loading: false
      }
   },
   components: {
      Checkbox,
      Select,
      BasicUserCard,
      PageList,
      ProgressButton, 
      AdminCard,
   },
   computed: {
   },
   methods: {
      delete_selection () {
         console.log('delete selection')
      },
      delete_user () {},
      fetch_page (store, opts) {
         opts.query = ""
         console.log('current filters:', this.filters)
         opts.filters = this.filters
         opts.name = ""
         opts.email = ""
         const users = store.dispatch('fetchAdminUsers', opts)
         console.log('users', users)
         return users
      },
      reset () {
        this.$refs.userList.reset()
      },
      toggleLocal () {
         console.log('toggle local')
         this.filters.local = !this.filters.local
         this.reset()
      }
   },
   mounted() {
      console.log("mounted")
   }
}

export default UsersTab
