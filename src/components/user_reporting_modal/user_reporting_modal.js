import { mapState } from 'pinia'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import List from 'src/components/list/list.vue'
import Modal from 'src/components/modal/modal.vue'
import UserLink from 'src/components/user_link/user_link.vue'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useReportsStore } from 'src/stores/reports.js'

import { reportUser } from 'src/api/user.js'

const UserReportingModal = {
  components: {
    List,
    Checkbox,
    Modal,
    UserLink,
  },
  data() {
    return {
      comment: '',
      forward: false,
      statusIdsToReport: new Set(),
      processing: false,
      error: false,
    }
  },
  computed: {
    isLoggedIn() {
      return !!this.$store.state.users.currentUser
    },
    isOpen() {
      console.log(this.reportModal)
      return this.isLoggedIn && this.reportModal.activated
    },
    userId() {
      return this.reportModal.userId
    },
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    remoteInstance() {
      return (
        !this.user.is_local &&
        this.user.screen_name.substr(this.user.screen_name.indexOf('@') + 1)
      )
    },
    ...mapState(useReportsStore, ['reportModal']),
  },
  watch: {
    userId: 'resetState',
  },
  methods: {
    resetState() {
      // Reset state
      this.comment = ''
      this.forward = false
      this.statusIdsToReport = new Set(this.reportModal.preTickedIds)
      this.processing = false
      this.error = false
    },
    closeModal() {
      useReportsStore().closeUserReportingModal()
    },
    onListSelect(selected) {
      this.statusIdsToReport = selected
    },
    reportUser() {
      this.processing = true
      this.error = false
      const params = {
        userId: this.userId,
        comment: this.comment,
        forward: this.forward,
        statusIds: [...this.statusIdsToReport],
        credentials: useOAuthStore().token,
      }
      reportUser({ ...params })
        .then(() => {
          this.processing = false
          this.resetState()
          this.closeModal()
        })
        .catch(() => {
          this.processing = false
          this.error = true
        })
    },
    clearError() {
      this.error = false
    },
    resize(e) {
      const target = e.target || e
      if (!(target instanceof window.Element)) {
        return
      }
      // Auto is needed to make textbox shrink when removing lines
      target.style.height = 'auto'
      target.style.height = `${target.scrollHeight}px`
      if (target.value === '') {
        target.style.height = null
      }
    },
  },
}

export default UserReportingModal
