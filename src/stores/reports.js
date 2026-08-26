import { defineStore } from 'pinia'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import { setReportState } from 'src/api/admin.js'

export const useReportsStore = defineStore('reports', {
  state: () => ({
    reportModal: {
      userId: null,
      statusIds: new Set(),
      preTickedIds: new Set(),
      activated: false,
    },
    reports: {},
  }),
  actions: {
    openUserReportingModal({ userId, statusIds = [] }) {
      const preTickedIds = new Set(statusIds)
      // There could be a case (i.e. user is only ever mentioned in someone else's post -> user popover)
      // where user has no known posts
      const userAllStatusesIds = useStatusesStore().statusesPerUser.get(userId) ?? new Set()
      // Set constructor should take care of duplicated IDs and order,
      // later duplicated IDs will be dropped in favor of earlier
      const sortedIds = new Set([...preTickedIds, ...userAllStatusesIds])

      this.reportModal.userId = userId
      this.reportModal.statusIds = sortedIds
      this.reportModal.preTickedIds = preTickedIds
      this.reportModal.activated = true
    },
    closeUserReportingModal() {
      this.reportModal.activated = false
    },
    setReportState({ id, state }) {
      const oldState = this.reports[id].state
      this.reports[id].state = state

      setReportState({
        id,
        state,
        credentials: useOAuthStore().token,
      }).catch((e) => {
        console.error('Failed to set report state', e)
        useInterfaceStore().pushGlobalNotice({
          level: 'error',
          messageKey: 'general.generic_error_message',
          messageArgs: [e.message],
          timeout: 5000,
        })
        this.reports[id].state = oldState
      })
    },
    addReport(report) {
      this.reports[report.id] = report
    },
  },
})
