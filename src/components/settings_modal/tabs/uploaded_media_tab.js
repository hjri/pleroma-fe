import { remove } from 'lodash-es'

import Attachment from 'src/components/attachment/attachment.vue'
import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMediaViewerStore } from 'src/stores/media_viewer.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { mapState } from 'pinia'

import { deleteMedia, getMedia, uploadedMedia } from 'src/api/user.js'

const PAGE_SIZE = 50

export default {
  components: { Attachment, ConfirmModal },
  data() {
    return {
      knownMedia: [],
      deleteModalVisible: false,
      mediaToDelete: 0,
      offset: 0,
      noMoreResults: false,
    }
  },
  methods: {
    fetchUsage(media) {
      media.loadingUsages = true
      getMedia({ id: media.attachment.id, withUsage: true }).then((result) => {
        media.usage = result.data.usage
        delete media.loadingUsages
      })
    },
    showDeleteModal(media) {
      this.deleteModalVisible = true
      this.mediaToDelete = media.attachment.id
    },
    deleteMedia() {
      deleteMedia({
        credentials: useOAuthStore().token,
        id: this.mediaToDelete,
      })
        .then(result => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'settings.uploaded_media.delete_success',
            level: 'success',
          })

          if (result) {
            remove(
              this.knownMedia,
              (m) => m.attachment.id == this.mediaToDelete,
            )
          }
        })
        .catch((err) => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'settings.uploaded_media.delete_error',
            messageArgs: { e: err.statusText },
            level: 'error',
          })
          this.deleteModalVisible = false
        }).finall(() => {
          this.deleteModalVisible = false
        })
    },

    refreshMedia() {
      this.knownMedia = []
      this.offset = 0
      this.noMoreResults = false

      this.loadMore()
    },
    loadMore() {
      uploadedMedia({
        credentials: useOAuthStore().token,
        offset: this.offset,
      }).then((result) => {
        if (result.length < PAGE_SIZE) this.noMoreResults = true
        this.offset += result.length
        this.knownMedia = this.knownMedia.concat(result)
      })
    },

    onMediaPreview(attachment) {
      useMediaViewerStore().setMedia([attachment])
    },
  },
  computed: {
    ...mapState(useInstanceCapabilitiesStore, ["mediaManagementAvailable"])
  },
  mounted() {
    if (this.mediaManagementAvailable) this.refreshMedia()
  },
}
