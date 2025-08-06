import BasicUserCard from '../../basic_user_card/basic_user_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import PageList from 'src/components/page_list/page_list.vue'
import AdminStatusCard from 'src/components/settings_modal/admin_tabs/admin_status_card.vue'

const AdminCard = {
   props: ['user_details'],
   data () {
      return {
         progress: false,
         top_level_expanded: false,
         json_expanded: false,
         timeline_expanded: false,
         just_approved: false,
         just_confirmed: false,
         just_deleted: false,
      }
   },
   computed: {
      isLoaded () {
         return typeof(this.user) !== 'undefined'
      },
      user () {
         return this.$store.getters.findUser(this.user_details.id)
      },
      relationship () {
         return this.$store.getters.relationship(this.user_details.id)
      },
      is_local () {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (typeof(u) !== 'undefined') {
            return u.is_local === true
         }
         return false
      },
      is_admin () {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.admin === true
         }
         return false
      },
      is_moderator () {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.moderator === true
         }
         return false
      },
      is_activated () {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (typeof(u) !== 'undefined') {
            return u.deactivated === false
         }
         return false
      },
      is_confirmed () {
         const u = this.$store.getters.findUser(this.user_details.id)
         return (u._original.pleroma.is_confirmed === true) || (this.just_confirmed === true)
      },
      is_approved () {
         return (this.user_details._original.is_approved === true) || (this.just_approved === true)
      }
   },
   components: {
      BasicUserCard,
      Checkbox,
      PageList,
      AdminStatusCard,
   },
   methods: {
      toggle_admin (v) {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (v === true) {
            this.$store.dispatch('adminAddUserToAdminGroup', u)
         } else {
            this.$store.dispatch('adminRemoveUserFromAdminGroup', u)
         }
      },
      toggle_moderator (v) {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (v === true) {
            this.$store.dispatch('adminAddUserToModeratorGroup', u)
         } else {
            this.$store.dispatch('adminRemoveUserFromModeratorGroup', u)
         }
      },
      toggle_activation (v) {
         const u = this.$store.getters.findUser(this.user_details.id)
         if (v === true) {
            this.$store.dispatch('adminActivateUser', u)
         } else {
            this.$store.dispatch('adminDeactivateUser', u)
         }
      },
      confirm_user () {
         const u = this.$store.getters.findUser(this.user_details.id)
         this.$store.dispatch('adminConfirmUser', u)
         this.just_confirmed = true
      },
      resend_confirmation_email () {
         const u = this.$store.getters.findUser(this.user_details.id)
         this.$store.dispatch('adminResendConfirmationEmail', u)
      },
      toggle_approval () {
         const u = this.$store.getters.findUser(this.user_details.id)
         this.$store.dispatch('adminApproveUser', u)
      },
      force_update_user () {
         this.$store.dispatch('fetchUser', this.user_details.id)
      },
      delete_selection () {
        const l = this.$refs.timelineList
        const s = l.getSelected()
        s.forEach(p => this.$store.dispatch('deleteStatus', p))
        l.reset()
      },
      delete_user () {
         if (!this.just_deleted) {
            const u = this.$store.getters.findUser(this.user_details.id)
            this.$store.dispatch('adminDeleteUser', u)
            this.just_deleted = true
         }
      },
      fetch_statuses (store, opts) {
         const u = this.$store.getters.findUser(this.user_details.id)
         const res = store.dispatch('adminListStatuses', { user: u,  opts: { page_size: opts.pageSize, godmode: true, with_reblogs: true}})
         return Promise.resolve(res.then(r => r.activities))
      }
   }
}

export default AdminCard
