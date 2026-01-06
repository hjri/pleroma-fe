import { mapState } from 'vuex'
import ProgressButton from '../progress_button/progress_button.vue'
import Popover from '../popover/popover.vue'
import UserListMenu from 'src/components/user_list_menu/user_list_menu.vue'
import ConfirmModal from '../confirm_modal/confirm_modal.vue'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'
import { useReportsStore } from 'src/stores/reports'

library.add(faEllipsisV)

const AccountActions = {
  props: ['user', 'relationship'],
  data() {
    return {
      showingConfirmBlock: false,
      showingConfirmRemoveFollower: false,
    }
  },
  components: {
    ProgressButton,
    Popover,
    UserListMenu,
    ConfirmModal,
    UserTimedFilterModal,
  },
  methods: {
    showConfirmRemoveUserFromFollowers() {
      this.showingConfirmRemoveFollower = true
    },
    hideConfirmRemoveUserFromFollowers() {
      this.showingConfirmRemoveFollower = false
    },
    hideConfirmBlock() {
      this.showingConfirmBlock = false
    },
    showRepeats() {
      this.$store.dispatch('showReblogs', this.user.id)
    },
    hideRepeats() {
      this.$store.dispatch('hideReblogs', this.user.id)
    },
    blockUser() {
      if (this.$refs.timedBlockDialog) {
        this.$refs.timedBlockDialog.optionallyPrompt()
      } else {
        if (!this.shouldConfirmBlock) {
          this.doBlockUser()
        } else {
          this.showingConfirmBlock = true
        }
      }
    },
    doBlockUser() {
      this.$store.dispatch('blockUser', { id: this.user.id })
      this.hideConfirmBlock()
    },
    unblockUser() {
      this.$store.dispatch('unblockUser', this.user.id)
    },
    removeUserFromFollowers() {
      if (!this.shouldConfirmRemoveUserFromFollowers) {
        this.doRemoveUserFromFollowers()
      } else {
        this.showConfirmRemoveUserFromFollowers()
      }
    },
    doRemoveUserFromFollowers() {
      this.$store.dispatch('removeUserFromFollowers', this.user.id)
      this.hideConfirmRemoveUserFromFollowers()
    },
    reportUser() {
      useReportsStore().openUserReportingModal({ userId: this.user.id })
    },
    openChat() {
      this.$router.push({
        name: 'chat',
        params: {
          username: this.$store.state.users.currentUser.screen_name,
          recipient_id: this.user.id,
        },
      })
    },
  },
  computed: {
    shouldConfirmBlock() {
      return this.$store.getters.mergedConfig.modalOnBlock
    },
    shouldConfirmRemoveUserFromFollowers() {
      return this.$store.getters.mergedConfig.modalOnRemoveUserFromFollowers
    },
    ...mapState({
      blockExpirationSupported: (state) => state.instance.blockExpiration,
      pleromaChatMessagesAvailable: (state) =>
        state.instance.pleromaChatMessagesAvailable,
    }),
  },
}

export default AccountActions
