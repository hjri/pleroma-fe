import { mapState } from 'pinia'

import Popover from 'src/components/popover/popover.vue'
import StillImage from 'src/components/still-image/still-image.vue'

import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronRight, faFolder } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronRight, faFolder)

const StatusBookmarkFolderMenu = {
  props: ['status', 'close'],
  data() {
    return {}
  },
  components: {
    Popover,
    StillImage,
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
        .then(() => this.$emit('onSuccess'))
        .catch((err) => this.$emit('onError', err.error.error))
    },
  },
}

export default StatusBookmarkFolderMenu
