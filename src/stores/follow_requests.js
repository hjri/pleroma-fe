import { defineStore } from 'pinia'

import followRequestFetcher from 'src/stores/fetchers/follow_requests.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import { approveUser, denyUser } from 'src/api/user.js'

export const useFollowRequestsStore = defineStore('followRequests', {
  state: () => ({
    fetcher: null,
    requests: new Map(),
    showingApproveConfirmDialog: false,
    showingDenyConfirmDialog: false,
    tempId: null,
  }),
  getters: {
    followRequestsCount(state) {
      return state.requests.size
    },
  },
  actions: {
    // Fetcher stuff
    startFetching() {
      if (this.fetcher) throw new Error('Fetcher already exists!')

      this.fetcher = followRequestFetcher({
        credentials: useOAuthStore().token,
      })

      this.fetcher.startFetching()
    },
    stopFetching() {
      if (!this.fetcher) throw new Error("Fetcher doesn't exists!")
      this.fetcher.stopFetching()
      this.fetcher = null
    },
    setFollowRequests(requests) {
      this.requests = new Map(requests.map((user) => [user.id, user]))
    },

    // Confirm dialogs
    showApproveConfirmDialog(id) {
      this.showingApproveConfirmDialog = true
      this.tempId = id
    },
    showDenyConfirmDialog(id) {
      this.showingDenyConfirmDialog = true
      this.tempId = id
    },
    hideApproveConfirmDialog() {
      this.showingApproveConfirmDialog = false
      this.tempId = null
    },
    hideDenyConfirmDialog() {
      this.showingDenyConfirmDialog = false
      this.tempId = null
    },

    // Dialog/Instant fork
    approve(id) {
      if (useMergedConfigStore().mergedConfig.modalOnApproveFollow) {
        this.showApproveConfirmDialog(id)
      } else {
        this.doApprove(id)
      }
    },
    deny(id) {
      if (useMergedConfigStore().mergedConfig.modalOnDenyFollow) {
        this.showDenyConfirmDialog(id)
      } else {
        this.doDeny(id)
      }
    },

    // Actual calls
    async doApprove(userId) {
      const id = userId ?? this.tempId
      this.hideApproveConfirmDialog()

      await approveUser({
        id,
        credentials: useOAuthStore().token,
      })

      const notifId = this.findFollowRequestNotificationId(id)
      notifId && useNotificationsStore().markSingleNotificationAsSeen(notifId)
      this.requests.delete(id)
    },
    async doDeny(userId) {
      const id = userId ?? this.tempId
      this.hideDenyConfirmDialog()

      await denyUser({
        id,
        credentials: useOAuthStore().token,
      })

      const notifId = this.findFollowRequestNotificationId(id)
      notifId && useNotificationsStore().markSingleNotificationAsSeen(notifId)
      this.requests.delete(id)
    },

    // Utility
    findFollowRequestNotificationId(userId) {
      const notif = useNotificationsStore().data.find(
        (notif) =>
          notif.from_profile.id === userId && notif.type === 'follow_request',
      )
      return notif?.id
    },
  },
})
