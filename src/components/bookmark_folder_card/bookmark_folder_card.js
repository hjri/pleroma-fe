import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'

library.add(faEllipsisH)

const BookmarkFolderCard = {
  props: ['folder', 'allBookmarks'],
  computed: {
    firstLetter() {
      return this.folder ? this.folder.name[0] : null
    },
  },
}

export default BookmarkFolderCard
