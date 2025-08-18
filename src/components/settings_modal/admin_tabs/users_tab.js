import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import BasicUserCard from 'src/components/basic_user_card/basic_user_card.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import AdminCard from 'src/components/settings_modal/admin_tabs/admin_card.vue'
import PageList from 'src/components/page_list/page_list.vue'
import TabSwitcher from 'src/components/tab_switcher/tab_switcher.jsx'
import Popover from 'src/components/popover/popover.vue'
import GenericConfirm from 'src/components/confirm_modal/generic_confirm.vue'

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
      filtersPrivileges: 'all',
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
      return this.filtersPrivileges === 'admin' || this.filtersPrivileges === 'modsnadmins'
    },
    filtersIsModerator () {
      return this.filtersPrivileges === 'moderator' || this.filtersPrivileges === 'modsnadmins'
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
    Popover,
    GenericConfirm
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
      const nopts = { ...opts, ...{
        query: this.filtersQuery,
        filters,
        name: this.filtersName,
        email: this.filtersEmail
      }}
      const users = store.dispatch('fetchAdminUsers', nopts)
      return users
    },
    reset () {
      this.$refs.userList.reset()
    },
    activateSelection () {
      this.$refs.confirmActivate.show()
      this.$refs.dropdown.hidePopover()
    },
    activateSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminActivateUser', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    deactivateSelection () {
      this.$refs.confirmDeactivate.show()
      this.$refs.dropdown.hidePopover()
    },
    deactivateSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => {
        // avoid deactivating yourself
        if (u.id !== this.$store.state.users.currentUser.id) {
          this.$store.dispatch('adminDeactivateUser', this.$store.getters.findUser(u.id))
        }
      })
      this.reset()
    },
    deleteSelection () {
      this.$refs.confirmDelete.show()
      this.$refs.dropdown.hidePopover()
    },
    deleteSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => {
        // avoid deleting yourself
        if (u.id !== this.$store.state.users.currentUser.id) {
          this.$store.dispatch('adminDeleteUser', this.$store.getters.findUser(u.id))
        }
      })
      this.reset()
    },
    grantAdminSelection () {
      this.$refs.confirmGrantAdmin.show()
      this.$refs.dropdown.hidePopover()
    },
    grantAdminSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminAddUserToAdminGroup', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    revokeAdminSelection () {
      this.$refs.confirmRevokeAdminSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    revokeAdminSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => {
        // avoid shooting yourself in the foot
        if (u.id !== this.$store.state.users.currentUser.id) {
          this.$store.dispatch('adminRemoveUserToAdminGroup', this.$store.getters.findUser(u.id))
        }
      })
      this.reset()
    },
    grantModeratorSelection () {
      this.$refs.confirmGrantModeratorSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    grantModeratorSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminAddUserToModeratorGroup', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    revokeModeratorSelection () {
      this.$refs.confirmRevokeModeratorSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    revokeModeratorSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => {
        // you know the drill
        if (u.id !== this.$store.state.users.currentUser.id) {
          this.$store.dispatch('adminRemoveUserToModeratorGroup', this.$store.getters.findUser(u.id))
        }
      })
      this.reset()
    },
    approveSelection () {
      this.$refs.confirmApproveSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    approveSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminApproveUser', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    confirmUserSelection () {
      this.$refs.confirmSelection
    },
    confirmUserSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminConfirmUser', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    resendEmailSelection () {
      this.$refs.resendEmailSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    resendEmailSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminResendConfirmationEmail', this.$store.getters.findUser(u.id)))
      this.reset()
    },
    requirePasswordChangeSelection () {
      this.$refs.requirePasswordChangeSelection.show()
      this.$refs.dropdown.hidePopover()
    },
    requirePasswordChangeSelectionConfirmed () {
      const s = this.$refs.userList.getSelected()
      s.forEach(u => this.$store.dispatch('adminRequirePasswordChange', this.$store.getters.findUser(u.id)))
      this.reset()
    }
  },
  mounted () {
    this.init = true
    this.reset()
  }
}

export default UsersTab
