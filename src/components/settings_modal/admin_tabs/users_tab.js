import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import GenericConfirm from 'src/components/confirm_modal/generic_confirm.vue'
import PageList from 'src/components/page_list/page_list.vue'
import Popover from 'src/components/popover/popover.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import Select from 'src/components/select/select.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'

const UsersTab = {
  provide() {
    return {
      defaultDraftMode: true,
      defaultSource: 'admin',
    }
  },
  data() {
    return {
      init: false,
      filtersOrigin: 'local',
      filtersActivity: 'all',
      filtersPrivileges: 'all',
      filtersNeedApproval: false,
      filtersUnconfirmed: false,
      filtersQuery: '',
      filtersName: '',
      filtersEmail: '',
      expandedUser: null,
      loading: false,
    }
  },
  computed: {
    /**
     * do we filter for admins?
     * @returns {boolean}
     */
    filtersIsAdmin() {
      return (
        this.filtersPrivileges === 'admin' ||
        this.filtersPrivileges === 'modsnadmins'
      )
    },
    /**
     * do we filter for moderators?
     * @returns {boolean}
     */
    filtersIsModerator() {
      return (
        this.filtersPrivileges === 'moderator' ||
        this.filtersPrivileges === 'modsnadmins'
      )
    },
    /**
     * do we filter for active users?
     * @returns {boolean}
     */
    filtersActive() {
      return this.filtersActivity === 'active'
    },
    /**
     * do we filter for deactivated users?
     * @returns {boolean}
     */
    filtersDeactivated() {
      return this.filtersActivity === 'deactivated'
    },
    /**
     * do we filter for local users?
     * @returns {boolean}
     */
    filtersLocal() {
      return this.filtersOrigin === 'local'
    },
    /**
     * do we filter for external users?
     * @return {boolean}
     */
    filtersExternal() {
      return this.filtersOrigin === 'external'
    },
  },
  components: {
    Checkbox,
    Select,
    BasicUserCard,
    PageList,
    ProgressButton,
    AdminCard,
    TabSwitcher,
    Popover,
    GenericConfirm,
  },
  methods: {
    /**
     * fetch a new page of users via admin-api
     * @param {object} store
     * @param {object} opts
     */
    fetchPage(store, opts) {
      if (!this.init) return new Promise(() => [])
      const filters = {
        isAdmin: this.filtersIsAdmin,
        isModerator: this.filtersIsModerator,
        active: this.filtersActive,
        deactivated: this.filtersDeactivated,
        local: this.filtersLocal,
        external: this.filtersExternal,
        needApproval: this.filtersNeedApproval,
        unconfirmed: this.filtersUnconfirmeUnconfirmed,
      }
      const nopts = {
        ...opts,
        ...{
          query: this.filtersQuery,
          filters,
          name: this.filtersName,
          email: this.filtersEmail,
        },
      }
      return store.dispatch('fetchAdminUsers', nopts)
    },
    /**
     * reset the userlist explicitly
     */
    reset() {
      this.$refs.userList.reset()
    },
    /**
     * show the confirmation box for bulk actions.
     * @param {string} box ref name specified for the confirm component
     */
    confirmSelection(box) {
      this.$refs[box].show()
      this.$refs.dropdown.hidePopover()
    },
    /**
     * called when a bulk action was confirmed
     * @param {string} action
     */
    selectionConfirmed(action) {
      const restricted = []
      const s = this.$refs.userList.getSelected()
      s.forEach((u) => {
        if (
          restricted.includes(action) !== false ||
          u.id !== this.$store.state.users.currentUser.id
        ) {
          const uf = this.$store.getters.findUser(u.id)
          console.log('user: ', uf)
          this.$store.dispatch(action, this.$store.getters.findUser(u.id))
        }
      })
      this.reset()
    },
  },
  /**
   * mark as initialized and reset user list
   */
  mounted() {
    this.init = true
    this.reset()
  },
}

export default UsersTab
