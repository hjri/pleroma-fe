import { mapState } from 'pinia'

import Attachment from 'src/components/attachment/attachment.vue'
import Gallery from 'src/components/gallery/gallery.vue'
import LinkPreview from 'src/components/link-preview/link-preview.vue'
import Poll from 'src/components/poll/poll.vue'
import StatusBody from 'src/components/status_body/status_body.vue'

import { useMediaViewerStore } from 'src/stores/media_viewer.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleNotch,
  faFile,
  faImage,
  faLink,
  faMusic,
  faPollH,
} from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch, faFile, faMusic, faImage, faLink, faPollH)

const StatusContent = {
  name: 'StatusContent',
  props: {
    status: {
      // Main thing
      type: Object,
      required: true,
    },
    compact: {
      // Resizes emoji and minimizes vertical space used
      // Primarily used for showing status in react notifications
      type: Boolean,
      default: false,
    },
    collapse: {
      // replaces newlines with spaces
      type: Boolean,
      default: false,
    },
    singleLine: {
      // Show entire thing (subject and content) in a single line
      // Primarily used in chats
      type: Boolean,
      default: false,
    },
    inConversation: {
      // Whether status content is being shown in an (open) conversation
      // Used to control whether to display attachments or not
      type: Boolean,
      default: false,
    },
  },
  emits: ['parseReady', 'mediaplay', 'mediapause'],
  computed: {
    statusCard() {
      if (!this.status.card) return null
      return this.status.card.url === this.status.quote_url
        ? null
        : this.status.card
    },
    hideAttachments() {
      return (
        !this.fullContent &&
        ((this.mergedConfig.hideAttachments && !this.inConversation) ||
          (this.mergedConfig.hideAttachmentsInConv && this.inConversation))
      )
    },
    attachmentSize() {
      if (this.compact) {
        return 'small'
      } else if (
        (this.mergedConfig.hideAttachments && !this.inConversation) ||
        (this.mergedConfig.hideAttachmentsInConv && this.inConversation) ||
        this.status.attachments.length > this.maxThumbnails
      ) {
        return 'hide'
      }
      return 'normal'
    },
    maxThumbnails() {
      return this.mergedConfig.maxThumbnails
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
    ...mapState(useUsersStore, ['currentUser']),
  },
  components: {
    Attachment,
    Poll,
    Gallery,
    LinkPreview,
    StatusBody,
  },
  methods: {
    setMedia() {
      const attachments =
        this.attachmentSize === 'hide'
          ? this.status.attachments
          : this.galleryAttachments
      return () => useMediaViewerStore().setMedia(attachments)
    },
  },
}

export default StatusContent
