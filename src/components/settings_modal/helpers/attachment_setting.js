import Attachment from 'src/components/attachment/attachment.vue'
import MediaUpload from 'src/components/media_upload/media_upload.vue'
import Setting from './setting.js'

import { useInstanceStore } from 'src/stores/instance.js'

import { fileTypeExt } from 'src/services/file_type/file_type.service.js'

export default {
  ...Setting,
  props: {
    ...Setting.props,
    compact: Boolean,
    acceptTypes: {
      type: String,
      required: false,
      default: 'image/*',
    },
  },
  components: {
    ...Setting.components,
    MediaUpload,
    Attachment,
  },
  computed: {
    ...Setting.computed,
    attachment() {
      const path = this.realDraftMode ? this.draft : this.state
      // The "server" part is primarily for local dev, but could be useful for alt-domain or multiuser usage.
      const url = path.includes('://') ? path : useInstanceStore().server + path
      return {
        type: fileTypeExt(url),
        url,
      }
    },
  },
  methods: {
    ...Setting.methods,
    setMediaFile(fileInfo) {
      if (this.realDraftMode) {
        this.draft = fileInfo.url
      } else {
        this.configSink(this.path, fileInfo.url)
      }
    },
  },
}
