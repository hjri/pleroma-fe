import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { search2, searchUsers } from 'src/api/public.js'

export const useSearchStore = defineStore('search', {
  actions: {
    async search({ q, resolve, limit, offset, following, type }) {
      const { data, ...rest } = await search2({
        q,
        resolve,
        limit,
        offset,
        following,
        type,
        credentials: useOAuthStore().token,
      })

      const { accounts, statuses } = data

      useUsersStore().addNewUsers({
        ...rest,
        data: accounts,
      })

      useStatusesStore().addNewStatuses({
        ...rest,
        statuses,
      })

      const output = {}
      output.statuses = statuses.map((s) =>
        useStatusesStore().allStatuses.get(s.id),
      )
      output.accounts = accounts.map((s) => useUsersStore().findUser(s.id))
      return output
    },

    // Search
    searchUsers({ query }) {
      return searchUsers({
        query,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const { data } = result
        useUsersStore().addNewUsers(result)

        return data.map((s) => useUsersStore().findUser(s.id))
      })
    },
  },
})
