import { mapState } from 'pinia'
import { getBookmarkFolderEntries } from 'src/components/navigation/filter.js'
import NavigationEntry from 'src/components/navigation/navigation_entry.vue'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders'

export const BookmarkFoldersMenuContent = {
  props: ['showPin'],
  components: {
    NavigationEntry,
  },
  computed: {
    ...mapState(useBookmarkFoldersStore, {
      folders: getBookmarkFolderEntries,
    }),
  },
}

export default BookmarkFoldersMenuContent
