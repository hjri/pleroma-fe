import { find, remove } from 'lodash'
import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import {
  createBookmarkFolder,
  deleteBookmarkFolder,
  fetchBookmarkFolders,
  updateBookmarkFolder,
} from 'src/services/api/api.service.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

export const useBookmarkFoldersStore = defineStore('bookmarkFolders', {
  state: () => ({
    allFolders: [],
  }),
  getters: {
    findBookmarkFolderName() {
      return (id) => {
        const folder = this.allFolders.find((folder) => folder.id === id)

        if (!folder) return
        return folder.name
      }
    },
  },
  actions: {
    startFetching() {
      promiseInterval(() => {
        this.fetcher = fetchBookmarkFolders({
          credentials: useOAuthStore().token,
        })
          .then(
            (folders) => this.setBookmarkFolders(folders),
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
    setBookmarkFolders(value) {
      this.allFolders = value
    },
    setBookmarkFolder({ id, name, emoji, emoji_url: emojiUrl }) {
      const entry = find(this.allFolders, { id })
      if (!entry) {
        this.allFolders.push({ id, name, emoji, emoji_url: emojiUrl })
      } else {
        entry.name = name
        entry.emoji = emoji
        entry.emoji_url = emojiUrl
      }
    },
    createBookmarkFolder({ name, emoji }) {
      return createBookmarkFolder({
        name,
        emoji,
        credentials: useOAuthStore().token,
      }).then((folder) => {
        this.setBookmarkFolder(folder)
        return folder
      })
    },
    updateBookmarkFolder({ folderId, name, emoji }) {
      return updateBookmarkFolder({
        credentials: useOAuthStore().token,
        folderId,
        name,
        emoji,
      }).then((folder) => {
        this.setBookmarkFolder(folder)
        return folder
      })
    },
    deleteBookmarkFolder({ folderId }) {
      deleteBookmarkFolder({
        folderId,
        credentials: useOAuthStore().token,
      })
      remove(this.allFolders, (folder) => folder.id === folderId)
    },
  },
})
