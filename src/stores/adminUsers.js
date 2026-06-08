import { defineStore } from 'pinia'

export const useAdminUsersStore = defineStore('adminUsers', {
  state: () => ({
    users: new Map()
  }),
  getters: {
    getUser(state) {
      return (id) => state.users.get(id)
    },
  },
  actions: {
    async fetchAdminUsers(opts) {
      const data = await window.vuex.state.api.backendInteractor.adminListUsers({
        opts,
      })

      data.users.forEach((user) => {
        window.vuex.dispatch('fetchUserIfMissing', user.id),
        this.users.set(user.id, user)
      })

      return data
    },
  },
})
