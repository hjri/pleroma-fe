import BasicUserCard from '../../basic_user_card/basic_user_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import PageList from 'src/components/page_list/page_list.vue'
import AdminStatusCard from 'src/components/settings_modal/admin_tabs/admin_status_card.vue'

const AdminCard = {
   props: ['userDetails'],
   data () {
      return {
         progress: false,
         topLevelExpanded: false,
         jsonExpanded: false,
         timelineExpanded: false,
         justApproved: false,
         justConfirmed: false,
         justDeleted: false,
      }
   },
   computed: {
      isLoaded () {
         return typeof(this.user) !== 'undefined'
      },
      user () {
         return this.$store.getters.findUser(this.userDetails.id)
      },
      relationship () {
         return this.$store.getters.relationship(this.userDetails.id)
      },
      isLocal () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.is_local === true
         }
         return false
      },
      isAdmin () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.admin === true
         }
         return false
      },
      isModerator () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.moderator === true
         }
         return false
      },
      isActivated () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.deactivated === false
         }
         return false
      },
      isConfirmed () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         return (u._original.pleroma.is_confirmed === true) || (this.justConfirmed === true)
      },
      isApproved () {
         return (this.userDetails._original.is_approved === true) || (this.justApproved === true)
      }
   },
   components: {
      BasicUserCard,
      Checkbox,
      PageList,
      AdminStatusCard,
   },
   methods: {
      toggleAdmin (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (v === true) {
            this.$store.dispatch('adminAddUserToAdminGroup', u)
         } else {
            this.$store.dispatch('adminRemoveUserFromAdminGroup', u)
         }
      },
      toggleModerator (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (v === true) {
            this.$store.dispatch('adminAddUserToModeratorGroup', u)
         } else {
            this.$store.dispatch('adminRemoveUserFromModeratorGroup', u)
         }
      },
      toggleActivation (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (v === true) {
            this.$store.dispatch('adminActivateUser', u)
         } else {
            this.$store.dispatch('adminDeactivateUser', u)
         }
      },
      confirmUser () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         this.$store.dispatch('adminConfirmUser', u)
         this.just_confirmed = true
      },
      resendConfirmationEmail () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         this.$store.dispatch('adminResendConfirmationEmail', u)
      },
      toggleApproval () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         this.$store.dispatch('adminApproveUser', u)
      },
      forceUpdateUser () {
         this.$store.dispatch('fetchUser', this.userDetails.id)
      },
      deleteSelection () {
        const l = this.$refs.timelineList
        const s = l.getSelected()
        s.forEach(p => this.$store.dispatch('deleteStatus', p))
        l.reset()
      },
      deleteUser () {
         if (!this.justDeleted) {
            const u = this.$store.getters.findUser(this.userDetails.id)
            this.$store.dispatch('adminDeleteUser', u)
            this.justDeleted = true
         }
      },
      fetchStatuses (store, opts) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         const res = store.dispatch('adminListStatuses', { user: u,  opts: { pageSize: opts.pageSize, godmode: true, withReblogs: true}})
         return Promise.resolve(res.then(r => r.activities))
      }
   }
}

export default AdminCard
