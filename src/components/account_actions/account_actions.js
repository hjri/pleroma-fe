import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Popover from 'src/components/popover/popover.vue'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import UserListMenu from 'src/components/user_list_menu/user_list_menu.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useReportsStore } from 'src/stores/reports'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons'

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
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
    UserTimedFilterModal: defineAsyncComponent(
      () =>
        import(
          'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'
        ),
    ),
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
          username: useUsersStore().currentUser.screen_name,
          recipient_id: this.user.id,
        },
      })
    },
  },
  computed: {
    shouldConfirmBlock() {
      return useMergedConfigStore().mergedConfig.modalOnBlock
    },
    shouldConfirmRemoveUserFromFollowers() {
      return useMergedConfigStore().mergedConfig.modalOnRemoveUserFromFollowers
    },
    ...mapState(useInstanceCapabilitiesStore, [
      'blockExpiration',
      'pleromaChatMessagesAvailable',
    ]),
  },
}

export default AccountActions
