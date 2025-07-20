import BasicUserCard from '../../basic_user_card/basic_user_card.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'

const AdminCard = {
   props: ['userDetails'],
   data () {
      return {
         progress: false,
         top_level_expanded: false,
         json_expanded: false,
         just_approved: false,
         just_confirmed: false,
         just_deleted: false,
      }
   },
   mounted () {
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
      is_local () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.is_local === true
         }
         return false
      },
      is_admin () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.admin === true
         }
         return false
      },
      is_moderator () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.rights.moderator === true
         }
         return false
      },
      is_activated () {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (typeof(u) !== 'undefined') {
            return u.deactivated === false
         }
         return false
      },
      is_confirmed () {
         return (this.userDetails.is_confirmed === false) || (this.just_confirmed === true)
      },
      is_approved () {
         return (this.userDetails.is_approved === false) || (this.just_approved === true)
      }
   },
   components: {
      BasicUserCard,
      Checkbox
   },
   methods: {
      toggle_admin (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         console.log('user', u)
         if (v === true) {
            this.$store.dispatch('adminAddUserToAdminGroup', u).then(res => console.log("res: ", res))
         } else {
            this.$store.dispatch('adminRemoveUserFromAdminGroup', u)
         }
      },
      toggle_moderator (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (v === true) {
            this.$store.dispatch('adminAddUserToModeratorGroup', u)
         } else {
            this.$store.dispatch('adminRemoveUserFromModeratorGroup', u)
         }
      },
      toggle_activation (v) {
         const u = this.$store.getters.findUser(this.userDetails.id)
         if (v === true) {
            this.$store.dispatch('adminActivateUser', u)
         } else {
            this.$store.dispatch('adminDeactivateUser', u)
         }
      },
      toggle_confirmation () {},
      toggle_approval () {},
      force_update_user () {
         this.$store.dispatch('fetchUser', this.userDetails.id)
      },
      delete_user () {
         if (!this.just_deleted) {
            const u = this.$store.getters.findUser(this.userDetails.id)
            this.$store.dispatch('adminDeleteUser', u)
            this.just_deleted = true
         }
      }
   }
}

export default AdminCard
