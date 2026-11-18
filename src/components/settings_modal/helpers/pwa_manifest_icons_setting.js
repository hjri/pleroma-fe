import { clone } from 'lodash-es'

import Attachment from 'src/components/attachment/attachment.vue'
import MediaUpload from 'src/components/media_upload/media_upload.vue'
import Select from 'src/components/select/select.vue'
import Setting from './setting.js'

import { useInstanceStore } from 'src/stores/instance.js'

import { fileTypeExt } from 'src/services/file_type/file_type.service.js'

export default {
  ...Setting,
  components: {
    ...Setting.components,
    Select,
    Attachment,
    MediaUpload,
  },
  computed: {
    ...Setting.computed,
    purposeOptions() {
      return ['any', 'monochrome', 'maskable'].map((value) => ({
        value,
        key: value,
        label: this.$t('admin_dash.instance.pwa.icon.' + value),
      }))
    },
  },
  methods: {
    ...Setting.methods,
    attachment(e) {
      const path = e[':src']
      if (!path) {
        return {
          type: '',
          url: '',
        }
      }
      const url = path.includes('://') ? path : useInstanceStore().server + path

      return {
        type: fileTypeExt(url),
        url,
      }
    },
    setMediaFile({ event, index }) {
      this.edit(
        event.url,
        ':src',
      )
    },
    setPurpose({ event, index }) {
      this.edit(
        event,
        ':purpose',
        index,
      )
    },
    add() {
      this.visibleState = [...this.visibleState, {}]
    },
    remove(index) {
      const pre = this.visibleState.slice(0, index)
      const post = this.visibleState.slice(index + 1)

      this.visibleState = [...pre, ...post]
    },
    edit(value, field, index) {
      const string = event.target.value
      const pre = this.visibleState.slice(0, index)
      const post = this.visibleState.slice(index + 1)
      const item = clone(this.visibleState[index])

      if (!string) {
        delete item[field]
      } else {
        item[field] = string
      }

      this.visibleState = [...pre, item, ...post]
    },
  },
}
