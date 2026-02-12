import { clone } from 'lodash'

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
          mimetype: '',
          url: '',
        }
      }
      const url = path.includes('://') ? path : useInstanceStore().server + path

      return {
        mimetype: fileTypeExt(url),
        url,
      }
    },
    setMediaFile({ event, index }) {
      this.update({
        event: {
          target: {
            value: event.url,
          },
        },
        index,
        eventType: 'edit',
        field: ':src',
      })
    },
    setPurpose({ event, index }) {
      this.update({
        event: {
          target: {
            value: event,
          },
        },
        index,
        eventType: 'edit',
        field: ':purpose',
      })
    },
    getValue({ event, field, index, eventType }) {
      switch (eventType) {
        case 'add': {
          const res = [...this.visibleState, {}]
          return res
        }

        case 'remove': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)

          return [...pre, ...post]
        }

        case 'edit': {
          const pre = this.visibleState.slice(0, index)
          const post = this.visibleState.slice(index + 1)
          const item = clone(this.visibleState[index])
          const string = event.target.value

          if (!string) {
            delete item[field]
          } else {
            item[field] = string
          }

          return [...pre, item, ...post]
        }
      }
    },
  },
}
