import Checkbox from 'src/components/checkbox/checkbox.vue'
import GenericConfirm from 'src/components/confirm_modal/generic_confirm.vue'
import TextConfirm from 'src/components/confirm_modal/text_confirm.vue'
import Modal from 'src/components/modal/modal.vue'
import List from 'src/components/list/list.vue'
import Popover from 'src/components/popover/popover.vue'
import Select from 'src/components/select/select.vue'
import AdminStatusCard from 'src/components/settings_modal/admin_tabs/admin_status_card.vue'
import BasicUserCard from '../../basic_user_card/basic_user_card.vue'

const AdminCard = {
  props: {
    /**
     * minimal user info
     * @type {import('vue').PropType<{
     *   id: string,
     *   _original: {
     *     is_approved: boolean;
     *     is_confirmed: boolean;
     *   };
     * }>}
     */
    userDetails: {
      type: Object,
      required: true,
      /**
       * @param {any} u
       * @returns {u is { id: string; _original: { is_approved; is_confirmed: boolean; } } }
       */
      validator(u) {
        return (
          typeof u.id === 'string' &&
          typeof u._original === 'object' &&
          typeof u._original.is_approved === 'boolean' &&
          typeof u._original.is_confirmed === 'boolean'
        )
      },
    },
  },
  data() {
    return {
      progress: false,
      detailsExpanded: false,
      topLevelExpanded: false, // REMOVE
      jsonExpanded: false,
      timelineExpanded: false,
      justApproved: false,
      justConfirmed: false,
      justDeleted: false,
      showDirect: false,
      showReblogs: false,
      timelineSorting: 'des',
    }
  },
  computed: {
    /**
     * checks if the user is defined
     * @returns {boolean}
     */
    isLoaded() {
      return typeof this.user !== 'undefined'
    },
    /**
     * @returns {object} user info
     */
    user() {
      return this.$store.getters.findUser(this.userDetails.id)
    },
    /**
     * @returns {object} user relationship
     */
    relationship() {
      return this.$store.getters.relationship(this.userDetails.id)
    },
    /**
     * @returns {boolean} is user local
     */
    isLocal() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (typeof u !== 'undefined') {
        return u.is_local === true
      }
      return false
    },
    /**
     * @returns {boolean} is user admin
     */
    isAdmin() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (typeof u !== 'undefined') {
        return u.rights.admin === true
      }
      return false
    },
    /**
     * @returns {boolean} is user moderator
     */
    isModerator() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (typeof u !== 'undefined') {
        return u.rights.moderator === true
      }
      return false
    },
    /**
     * @returns {boolean} is user active
     */
    isActivated() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (typeof u !== 'undefined') {
        return u.deactivated === false
      }
      return false
    },
    /**
     * @returns {boolean} has this user been confirmed
     */
    isConfirmed() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      return u._original.is_confirmed === true || this.justConfirmed === true
    },
    /**
     * @returns {boolean} has this user been approved
     */
    isApproved() {
      return (
        this.userDetails._original.is_approved === true ||
        this.justApproved === true
      )
    },
  },
  components: {
    BasicUserCard,
    Checkbox,
    List,
    AdminStatusCard,
    Modal,
    Popover,
    GenericConfirm,
    Select,
    TextConfirm,
  },
  methods: {
    /**
     * @param {boolean} v set admin status
     */
    setAdmin(v) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (v === true) {
        this.$store.dispatch('adminAddUserToAdminGroup', u)
      } else {
        this.$store.dispatch('adminRemoveUserFromAdminGroup', u)
      }
    },
    /**
     * @param {boolean} v set moderator status
     */
    setModerator(v) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (v === true) {
        this.$store.dispatch('adminAddUserToModeratorGroup', u)
      } else {
        this.$store.dispatch('adminRemoveUserFromModeratorGroup', u)
      }
    },
    /**
     * @param {boolean} v set activation status
     */
    setActivation(v) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      if (v === true) {
        this.$store.dispatch('adminActivateUser', u)
      } else {
        this.$store.dispatch('adminDeactivateUser', u)
      }
    },
    /**
     * confirm this user
     */
    confirmUser() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      this.$store.dispatch('adminConfirmUser', u)
      this.just_confirmed = true
    },
    /**
     * try resending the confirmation email
     */
    resendConfirmationEmail() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      this.$store.dispatch('adminResendConfirmationEmail', u)
    },
    /**
     * approve this user
     */
    approveUser() {
      const u = this.$store.getters.findUser(this.userDetails.id)
      this.$store.dispatch('adminApproveUser', u)
    },
    /**
     * update user info from server
     */
    forceUpdateUser() {
      this.$store.dispatch('fetchUser', this.userDetails.id)
    },
    /**
     * delete selected statuses
     */
    deleteSelection() {
      const l = this.$refs.timelineList
      const s = l.getSelected()
      s.forEach((p) => this.$store.dispatch('deleteStatus', p))
      l.reset()
    },
    /**
     * delete this user. keep in mind that user deletion is not intuitive in pleroma backend.
     * it actually deletes all content of a user. the user itself will keep showing up in search results.
     */
    deleteUser() {
      if (!this.justDeleted) {
        const u = this.$store.getters.findUser(this.userDetails.id)
        this.$store.dispatch('adminDeleteUser', u)
        this.justDeleted = true
      }
    },
    /**
     * @param {string} text name of tag to be added to user
     */
    addUserTag(text) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      this.$store
        .dispatch('adminTagUser', { user: u, tag: text })
        .then(() => this.$store.dispatch('fetchUser', this.userDetails.id))
    },
    /**
     * @param {string} text name of tag to be removed from user
     */
    removeUserTag(text) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      this.$store
        .dispatch('adminUntagUser', { user: u, tag: text })
        .then(() => this.$store.dispatch('fetchUser', this.userDetails.id))
    },
    /**
     * @param {object} store
     * @param {object} opts
     * @returns {Promise<Array<object>>} statuses
     */
    async fetchStatuses(store, opts) {
      const u = this.$store.getters.findUser(this.userDetails.id)
      const res = store.dispatch('adminListStatuses', {
        user: u,
        opts: {
          pageSize: opts.pageSize,
          godmode: this.showDirect,
          withReblogs: this.showReblogs,
        },
      })
      return res.then((r) => {
        const a = r.activities
        console.log(this.timelineSorting)
        if (this.timelineSorting === 'des') {
          return [...a].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at),
          )
        } else if (this.timelineSorting === 'asc') {
          return [...a].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at),
          )
        } else return []
      })
    },
    confirmAction(box) {
      this.$refs[box].show()
      this.$refs.dropdownuser.hidePopover()
    },
    userActionConfirmed(action) {
      this.$store.dispatch(
        action,
        this.$store.getters.findUser(this.userDetails.id),
      )
    },
    statusActionConfirmed(action, opts) {
      const s = this.$refs.statusList.getSelected()
      s.forEach((p) => {
        this.$store.dispatch(action, { id: p.id, ...(opts || {}) })
      })
      this.reset()
    },
  },
}

export default AdminCard
