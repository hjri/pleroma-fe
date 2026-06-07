import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'

import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronRight, faFolder)

const StatusBookmarkFolderMenu = {
  props: ['status'],
  emits: ['success', 'error', 'close'],
  data() {
    return {}
  },
  components: {
    Popover,
  },
  computed: {
    ...mapState(useBookmarkFoldersStore, {
      folders: (store) => store.allFolders,
    }),
    folderId() {
      return this.status.bookmark_folder_id
    },
  },
  methods: {
    toggleFolder(id) {
      const value = id === this.folderId ? null : id

      this.$store
        .dispatch('bookmark', { id: this.status.id, bookmark_folder_id: value })
        .then(() => this.$emit('success'))
        .catch((err) => this.$emit('error', err.error.error))
    },
  },
}

export default StatusBookmarkFolderMenu
