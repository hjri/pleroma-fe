import FolderCard from 'src/components/folder_card/folder_card.vue'

import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'

const BookmarkFolders = {
  data() {
    return {
      isNew: false,
    }
  },
  components: {
    FolderCard,
  },
  computed: {
    bookmarkFolders() {
      return useBookmarkFoldersStore().allFolders
    },
  },
  methods: {
    cancelNewFolder() {
      this.isNew = false
    },
    newFolder() {
      this.isNew = true
    },
  },
}

export default BookmarkFolders
