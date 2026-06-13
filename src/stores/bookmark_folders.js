import { find, remove } from 'lodash'
import { defineStore } from 'pinia'

import { useCredentialsStore } from 'src/stores/credentials.js'

import {
  createBookmarkFolder,
  deleteBookmarkFolder,
  updateBookmarkFolder,
} from 'src/services/api/api.service.js'

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
        credentials: useCredentialsStore().current,
      }).then((folder) => {
        this.setBookmarkFolder(folder)
        return folder
      })
    },
    updateBookmarkFolder({ folderId, name, emoji }) {
      return updateBookmarkFolder({
        credentials: useCredentialsStore().current,
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
        credentials: useCredentialsStore().current,
      })
      remove(this.allFolders, (folder) => folder.id === folderId)
    },
  },
})
