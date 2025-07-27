import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
import PageList from 'src/components/page_list/page_list.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

const UsersTab = {
  provide () {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin'
    }
  },
  data() {
    return {
      /* filters must match the filter options below initially, or the ui is gonna have a computer moment
       * no, i won't fix this
       * */
      filters_origin: 'local',
      filters_activity: 'all',
      filters_permission: 'all',
      filters_query: '',
      filters_name: '',
      filters_email: '',
      filters: {
        local: false,
        external: false,
        active: false,
        need_approval: false,
        unconfirmed: false,
        deactivated: false,
        is_admin: false,
        is_moderator: false,
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
    TabSwitcher,
  },
  methods: {
    update_origin (v) {
      switch (v) {
        case 'local':
          this.filters.local = true
          this.filters.external = false
          break;
        case 'external':
          this.filters.local = false
          this.filters.external = true
          break;
        default:
        case 'all':
          this.filters.local = false
          this.filters.external = false
          break;
      }
      this.reset()
    },
    update_activity (v) {
      switch (v) {
        case 'active':
          this.filters.active = true
          this.filters.deactivated = false
          break;
        case 'deactivated':
          this.filters.active = false
          this.filters.deactivated = true
          break;
        default:
        case 'all':
          this.filters.active = false
          this.filters.deactivated = false
          break;
      }
      this.reset()
    },
    update_permission (v) {
      switch (v) {
        case 'admin':
          this.filters.is_admin = true
          this.filters.is_moderator = false
          break;
        case 'moderator':
          this.filters.is_admin = false
          this.filters.is_moderator = true
          break;
        case 'modsnadmins':
          this.filters.is_admin = true
          this.filters.is_moderator = true
          break;
        default:
        case 'all':
          this.filters.is_admin = false
          this.filters.is_moderator = false
          break;
      }
      this.reset()
    },
    fetch_page (store, opts) {
      const users = store.dispatch('fetchAdminUsers', { ...opts, ...{
        query: this.filters_query,
        filters: this.filters,
        name: this.filters_name,
        email: this.filters_email
      }})
      return users
    },
    reset () {
      this.$refs.userList.reset()
    },
    activate_selection () {
      const s = this.$refs.userList.selected()
      s.forEach(u => this.$store.dispatch('adminActivateUser', this.$store.getters.findUser(u.id)))
    },
    deactivate_selection () {
      const s = this.$refs.userList.selected()
      s.forEach(u => this.$store.dispatch('adminDeactivateUser', this.$store.getters.findUser(u.id)))
    },
    delete_selection () {
      const s = this.$refs.userList.selected()
      s.forEach(u => this.$store.dispatch('adminDeleteUser', this.$store.getters.findUser(u.id)))
      this.reset()
    }
  },
  mounted () {
    /* make sure init state is correct */
    this.update_origin(this.filters_origin)
    this.update_activity(this.filters_activity)
    this.update_permission(this.filters_permission)
  }
}

export default UsersTab
