import { defineStore } from 'pinia'

const defaultState = {
  credentials: null,
}

export const useCredentialsStore = defineStore('credentials', {
  state: () => ({ ...defaultState }),
  actions: {
    setCredentials(credentials) {
      this.credentials = credentials
    },
  },
  getters: {
    current() {
      return window.vuex.state.users.currentUser.credentials
    },
  },
})
