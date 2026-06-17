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
      promiseInterval(() => {
        this.fetcher = fetchLists({
          credentials: useOAuthStore().token,
        })
          .then(
            (lists) => this.setLists(lists),
            (rej) => console.error(rej),
          )
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
    },
    createList({ title }) {
      return createList({
        title,
        credentials: useOAuthStore().token,
      }).then((list) => {
        this.setList({ listId: list.id, title })
        return list
      })
    },
    fetchList({ listId }) {
      return getList({
        listId,
        credentials: useOAuthStore().token,
      }).then((list) => this.setList({ listId: list.id, title: list.title }))
    },
    fetchListAccounts({ listId }) {
      return getListAccounts({
        listId,
        credentials: useOAuthStore().token,
      }).then((accountIds) => {
        if (!this.allListsObject[listId]) {
          this.allListsObject[listId] = { accountIds: [] }
        }
        this.allListsObject[listId].accountIds = accountIds
      })
    },
    setList({ listId, title }) {
      updateList({
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
    setListAccounts({ listId, accountIds }) {
      const saved = this.allListsObject[listId]?.accountIds || []
      const added = accountIds.filter((id) => !saved.includes(id))
      const removed = saved.filter((id) => !accountIds.includes(id))
      if (!this.allListsObject[listId]) {
        this.allListsObject[listId] = { accountIds: [] }
      }
      this.allListsObject[listId].accountIds = accountIds
      if (added.length > 0) {
        addAccountsToList({
          listId,
          accountIds: added,
          credentials: useOAuthStore().token,
        })
      }
      if (removed.length > 0) {
        removeAccountsFromList({
          listId,
          accountIds: removed,
          credentials: useOAuthStore().token,
        })
      }
    },
    addListAccount({ listId, accountId }) {
      return addAccountsToList({
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
    removeListAccount({ listId, accountId }) {
      return removeAccountsFromList({
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
    deleteList({ listId }) {
      deleteList({
        listId,
        credentials: useOAuthStore().token,
      })

      delete this.allListsObject[listId]
      remove(this.allLists, (list) => list.id === listId)
    },
  },
})
