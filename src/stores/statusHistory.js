import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchStatusHistory } from 'src/api/public.js'

export const useStatusHistoryStore = defineStore('statusHistory', {
  state: () => ({
    id: null,
    modalActivated: false,
    history: null,
  }),
  actions: {
    openModal(id) {
      this.fetchStatusHistory(id).then(() => {
        this.id = id
        this.modalActivated = true
      })
    },
    closeModal() {
      this.id = null
      this.modalActivated = false
      this.history = null
    },
    fetchStatusHistory(id) {
      return fetchStatusHistory({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data }) => {
        this.history = data
      })
    },
  },
})
