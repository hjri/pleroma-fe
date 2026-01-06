import { find, remove } from 'lodash'
import { defineStore } from 'pinia'

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
      return window.vuex.state.api.backendInteractor
        .createBookmarkFolder({ name, emoji })
        .then((folder) => {
          this.setBookmarkFolder(folder)
          return folder
        })
    },
    updateBookmarkFolder({ folderId, name, emoji }) {
      return window.vuex.state.api.backendInteractor
        .updateBookmarkFolder({ folderId, name, emoji })
        .then((folder) => {
          this.setBookmarkFolder(folder)
          return folder
        })
    },
    deleteBookmarkFolder({ folderId }) {
      window.vuex.state.api.backendInteractor.deleteBookmarkFolder({ folderId })
      remove(this.allFolders, (folder) => folder.id === folderId)
    },
  },
})
