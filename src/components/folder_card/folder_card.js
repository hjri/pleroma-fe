import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons'

library.add(faEllipsisH)

const FolderCard = {
  props: {
    name: {
      type: String,
      required: true,
    },
    emoji: {
      type: String,
      required: false,
      default: null,
    },
    emojiUrl: {
      type: String,
      required: false,
      default: null,
    },
    link: {
      type: Object,
      required: true,
    },
    linkEdit: {
      type: Object,
      required: true,
    },
  },
  computed: {
    firstLetter() {
      return this.name[0]
    },
  },
}

export default FolderCard
