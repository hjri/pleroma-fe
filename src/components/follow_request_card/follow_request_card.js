import { defineAsyncComponent } from 'vue'

import BasicUserCard from '../basic_user_card/basic_user_card.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import { approveUser, denyUser } from 'src/api/user.js'

const FollowRequestCard = {
  props: ['user'],
  components: {
    BasicUserCard,
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
  },
  data() {
    return {
      showingApproveConfirmDialog: false,
      showingDenyConfirmDialog: false,
    }
  },
  methods: {
    findFollowRequestNotificationId() {
      const notif = useNotificationsStore().data.find(
        (notif) =>
          notif.from_profile.id === this.user.id &&
          notif.type === 'follow_request',
      )
      return notif?.id
    },
    showApproveConfirmDialog() {
      this.showingApproveConfirmDialog = true
    },
    hideApproveConfirmDialog() {
      this.showingApproveConfirmDialog = false
    },
    showDenyConfirmDialog() {
      this.showingDenyConfirmDialog = true
    },
    hideDenyConfirmDialog() {
      this.showingDenyConfirmDialog = false
    },
    approveUser() {
      if (this.shouldConfirmApprove) {
        this.showApproveConfirmDialog()
      } else {
        this.doApprove()
      }
    },
    doApprove() {
      approveUser({
        id: this.user.id,
        credentials: useOAuthStore().token,
      })
      // TODO fix
      this.$store.dispatch('removeFollowRequest', this.user)

      const notifId = this.findFollowRequestNotificationId()
      useNotificationsStore().markSingleNotificationAsSeen(notifId)
      this.hideApproveConfirmDialog()
    },
    denyUser() {
      if (this.shouldConfirmDeny) {
        this.showDenyConfirmDialog()
      } else {
        this.doDeny()
      }
    },
    doDeny() {
      const notifId = this.findFollowRequestNotificationId()

      denyUser({
        id: this.user.id,
        credentials: useOAuthStore().token,
      }).then(() => {
        useNotificationsStore().dismissNotificationLocal(notifId)
        // TODO fix
        this.$store.dispatch('removeFollowRequest', this.user)
      })
      this.hideDenyConfirmDialog()
    },
  },
  computed: {
    mergedConfig() {
      return useMergedConfigStore().mergedConfig
    },
    shouldConfirmApprove() {
      return this.mergedConfig.modalOnApproveFollow
    },
    shouldConfirmDeny() {
      return this.mergedConfig.modalOnDenyFollow
    },
  },
}

export default FollowRequestCard
