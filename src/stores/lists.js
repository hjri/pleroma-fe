import { find, remove } from 'lodash'
import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import {
  addAccountsToList,
  createList,
  deleteList,
  fetchLists,
  getList,
  getListAccounts,
  removeAccountsFromList,
  updateList,
} from 'src/api/user.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

export const useListsStore = defineStore('lists', {
  state: () => ({
    fetcher: null,
    allLists: [],
    allListsObject: {},
  }),
  getters: {
    findListTitle() {
      return (id) => {
        if (!this.allListsObject[id]) return
        return this.allListsObject[id].title
      }
    },
    findListAccounts() {
      return (id) => [...this.allListsObject[id].accountIds]
    },
  },
  actions: {
    startFetching() {
      this.fetcher = promiseInterval(() => {
        fetchLists({
          credentials: useOAuthStore().token,
        })
          .then(({ data: lists }) => this.setLists(lists))
          .catch((e) => {
            console.error(e)
          })
      }, 240000)
    },
    stopFetching() {
      this.fetcher?.stop()
    },
    setLists(value) {
      this.allLists = value
      this.allListsObject = Object.fromEntries(
        value.map((list) => [list.id, list]),
      )
    },
    async createList({ title }) {
      return await createList({
        title,
        credentials: useOAuthStore().token,
      }).then(({ data: list }) => {
        this.setList({ listId: list.id, title })
        return list
      })
    },
    async fetchList({ listId }) {
      return await getList({
        listId,
        credentials: useOAuthStore().token,
      }).then(({ data: list }) =>
        this.setList({ listId: list.id, title: list.title }),
      )
    },
    async fetchListAccounts({ listId }) {
      return await getListAccounts({
        listId,
        credentials: useOAuthStore().token,
      }).then(({ data: accountIds }) => {
        if (!this.allListsObject[listId]) {
          this.allListsObject[listId] = { accountIds: [] }
        }
        this.allListsObject[listId].accountIds = accountIds
      })
    },
    async setList({ listId, title }) {
      await updateList({
        listId,
        title,
        credentials: useOAuthStore().token,
      })

      if (!this.allListsObject[listId]) {
        this.allListsObject[listId] = { accountIds: [] }
      }
      this.allListsObject[listId].title = title

      const entry = find(this.allLists, { id: listId })
      if (!entry) {
        this.allLists.push({ id: listId, title })
      } else {
        entry.title = title
      }
    },
    async setListAccounts({ listId, accountIds }) {
      const saved = this.allListsObject[listId]?.accountIds || []
      const added = accountIds.filter((id) => !saved.includes(id))
      const removed = saved.filter((id) => !accountIds.includes(id))
      if (!this.allListsObject[listId]) {
        this.allListsObject[listId] = { accountIds: [] }
      }
      this.allListsObject[listId].accountIds = accountIds
      const promises = []
      if (added.length > 0) {
        promises.push(
          addAccountsToList({
            listId,
            accountIds: added,
            credentials: useOAuthStore().token,
          }),
        )
      }
      if (removed.length > 0) {
        promises.push(
          removeAccountsFromList({
            listId,
            accountIds: removed,
            credentials: useOAuthStore().token,
          }),
        )
      }
      await Promise.all(promises)
    },
    async addListAccount({ listId, accountId }) {
      return await addAccountsToList({
        listId,
        accountIds: [accountId],
        credentials: useOAuthStore().token,
      }).then((result) => {
        if (!this.allListsObject[listId]) {
          this.allListsObject[listId] = { accountIds: [] }
        }
        this.allListsObject[listId].accountIds.push(accountId)
        return result
      })
    },
    async removeListAccount({ listId, accountId }) {
      return await removeAccountsFromList({
        listId,
        accountIds: [accountId],
        credentials: useOAuthStore().token,
      }).then((result) => {
        if (!this.allListsObject[listId]) {
          this.allListsObject[listId] = { accountIds: [] }
        }
        const { accountIds } = this.allListsObject[listId]
        const set = new Set(accountIds)
        set.delete(accountId)
        this.allListsObject[listId].accountIds = [...set]

        return result
      })
    },
    async deleteList({ listId }) {
      await deleteList({
        listId,
        credentials: useOAuthStore().token,
      })

      delete this.allListsObject[listId]
      remove(this.allLists, (list) => list.id === listId)
    },
  },
})
