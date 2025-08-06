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
      init: false,
      filters_origin: 'local',
      filters_activity: 'all',
      filters_permission: 'all',
      filters_query: '',
      filters_name: '',
      filters_email: '',
      expandedUser: null,
      loading: false
    }
  },
  computed: {
    filters_is_admin () {
      return this.filters_permission === 'admin' || this.filters_permission === 'modsnadmins'
    },
    filters_is_moderator () {
      return this.filters_permission === 'moderator' || this.filters_permission === 'modsnadmins'
    },
    filters_active () {
      return this.filters_activity === 'active'
    },
    filters_deactivated () {
      return this.filters_activity === 'deactivated'
    },
    filters_local () {
      return this.filters_origin === 'local'
    },
    filters_external () {
      return this.filters_origin === 'external'
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
    fetch_page (store, opts) {
      if(!this.init) return new Promise(() => [])
      const filters = {
        is_admin: this.filters_is_admin,
        is_moderator: this.filters_is_moderator,
        active: this.filters_active,
        deactivated: this.filters_deactivated,
        local: this.filters_local,
        external: this.filters_external
      }
      const users = store.dispatch('fetchAdminUsers', { ...opts, ...{
        query: this.filters_query,
        filters,
        name: this.filters_name,
        email: this.filters_email
      }})
      return users
    },
    reset () {
      this.$refs.userList.reset()
    },
    activate_selection () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminActivateUser', this.$store.getters.findUser(u.id)))
    },
    deactivate_selection () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminDeactivateUser', this.$store.getters.findUser(u.id)))
    },
    delete_selection () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminDeleteUser', this.$store.getters.findUser(u.id)))
      this.reset()
    }
  },
  mounted () {
    this.init = true
    this.reset()
  }
}

export default UsersTab
