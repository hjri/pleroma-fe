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
      filtersOrigin: 'local',
      filtersActivity: 'all',
      filtersPermission: 'all',
      filtersNeedApproval: false,
      filtersUnconfirmed: false,
      filtersQuery: '',
      filtersName: '',
      filtersEmail: '',
      expandedUser: null,
      loading: false
    }
  },
  computed: {
    filtersIsAdmin () {
      return this.filtersPermission === 'admin' || this.filtersPermission === 'modsnadmins'
    },
    filtersIsModerator () {
      return this.filtersPermission === 'moderator' || this.filtersPermission === 'modsnadmins'
    },
    filtersActive () {
      return this.filtersActivity === 'active'
    },
    filtersDeactivated () {
      return this.filtersActivity === 'deactivated'
    },
    filtersLocal () {
      return this.filtersOrigin === 'local'
    },
    filtersExternal () {
      return this.filtersOrigin === 'external'
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
    fetchPage (store, opts) {
      if(!this.init) return new Promise(() => [])
      const filters = {
        isAdmin: this.filtersIsAdmin,
        isModerator: this.filtersIsModerator,
        active: this.filtersActive,
        deactivated: this.filtersDeactivated,
        local: this.filtersLocal,
        external: this.filtersExternal,
        needApproval: this.filtersNeedApproval,
        unconfirmed: this.filtersUnconfirmeUnconfirmed
      }
      const users = store.dispatch('fetchAdminUsers', { ...opts, ...{
        query: this.filtersQuery,
        filters,
        name: this.filtersName,
        email: this.filtersEmail
      }})
      return users
    },
    reset () {
      this.$refs.userList.reset()
    },
    activateSelection () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminActivateUser', this.$store.getters.findUser(u.id)))
    },
    deactivateSelection () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminDeactivateUser', this.$store.getters.findUser(u.id)))
    },
    deleteSelection () {
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
