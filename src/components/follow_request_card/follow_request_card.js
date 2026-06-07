import { defineAsyncComponent } from 'vue'

import { notificationsFromStore } from '../../services/notification_utils/notification_utils.js'
import BasicUserCard from '../basic_user_card/basic_user_card.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

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
      const notif = notificationsFromStore(this.$store).find(
        (notif) =>
          notif.from_profile.id === this.user.id &&
          notif.type === 'follow_request',
      )
      return notif && notif.id
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
      this.$store.state.api.backendInteractor.approveUser({ id: this.user.id })
      this.$store.dispatch('removeFollowRequest', this.user)

      const notifId = this.findFollowRequestNotificationId()
      this.$store.dispatch('markSingleNotificationAsSeen', { id: notifId })
      this.$store.dispatch('updateNotification', {
        id: notifId,
        updater: (notification) => {
          notification.type = 'follow'
        },
      })
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
      this.$store.state.api.backendInteractor
        .denyUser({ id: this.user.id })
        .then(() => {
          this.$store.dispatch('dismissNotificationLocal', { id: notifId })
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
