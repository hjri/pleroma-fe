/* eslint-env browser */

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch, faUpload } from '@fortawesome/free-solid-svg-icons'
import fileSizeFormatService from '../../services/file_size_format/file_size_format.js'
import statusPosterService from '../../services/status_poster/status_poster.service.js'

library.add(faUpload, faCircleNotch)

const mediaUpload = {
  data() {
    return {
      uploadCount: 0,
      uploadReady: true,
    }
  },
  computed: {
    uploading() {
      return this.uploadCount > 0
    },
  },
  methods: {
    onClick() {
      if (this.uploadReady) {
        this.$refs.input.click()
      }
    },
    async resizeImage(file) {
      // Skip if not an image or if it's a GIF
      if (!file.type.startsWith('image/') || file.type === 'image/gif') {
        return file
      }

      // Skip if image compression is disabled
      if (!this.$store.getters.mergedConfig.imageCompression) {
        return file
      }

      // For PNGs, check if animated
      if (file.type === 'image/png') {
        const isAnimated = await this.isAnimatedPng(file)
        if (isAnimated) {
          return file
        }
      }

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width
          let height = img.height
          const maxSize = 2048

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width)
              width = maxSize
            } else {
              width = Math.round((width * maxSize) / height)
              height = maxSize
            }
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Check WebP support by trying to create a WebP canvas
          const testCanvas = document.createElement('canvas')
          const supportsWebP = testCanvas
            .toDataURL('image/webp')
            .startsWith('data:image/webp')

          // Convert to WebP if supported and alwaysUseJpeg is false, otherwise JPEG
          const type =
            !this.$store.getters.mergedConfig.alwaysUseJpeg && supportsWebP
              ? 'image/webp'
              : 'image/jpeg'
          const extension = type === 'image/webp' ? '.webp' : '.jpg'

          // Remove the original extension and add new one
          const newFileName = file.name.replace(/\.[^/.]+$/, '') + extension

          canvas.toBlob(
            (blob) => {
              resolve(
                new File([blob], newFileName, {
                  type,
                  lastModified: Date.now(),
                }),
              )
            },
            type,
            0.85,
          )
        }
        img.src = URL.createObjectURL(file)
      })
    },
    async isAnimatedPng(file) {
      const buffer = await file.arrayBuffer()
      const view = new Uint8Array(buffer)
      // Look for animated PNG chunks (acTL)
      for (let i = 0; i < view.length - 8; i++) {
        if (
          view[i] === 0x61 && // a
          view[i + 1] === 0x63 && // c
          view[i + 2] === 0x54 && // T
          view[i + 3] === 0x4c
        ) {
          // L
          return true
        }
      }
      return false
    },
    async uploadFile(file) {
      const self = this
      const store = this.$store
      if (file.size > store.state.instance.uploadlimit) {
        const filesize = fileSizeFormatService.fileSizeFormat(file.size)
        const allowedsize = fileSizeFormatService.fileSizeFormat(
          store.state.instance.uploadlimit,
        )
        self.$emit('upload-failed', 'file_too_big', {
          filesize: filesize.num,
          filesizeunit: filesize.unit,
          allowedsize: allowedsize.num,
          allowedsizeunit: allowedsize.unit,
        })
        return
      }

      // Resize image if needed
      const processedFile = await this.resizeImage(file)
      const formData = new FormData()
      formData.append('file', processedFile)

      self.$emit('uploading')
      self.uploadCount++

      statusPosterService.uploadMedia({ store, formData }).then(
        (fileData) => {
          self.$emit('uploaded', fileData)
          self.decreaseUploadCount()
        },
        (error) => {
          console.error('Error uploading file', error)
          self.$emit('upload-failed', 'default')
          self.decreaseUploadCount()
        },
      )
    },
    decreaseUploadCount() {
      this.uploadCount--
      if (this.uploadCount === 0) {
        this.$emit('all-uploaded')
      }
    },
    clearFile() {
      this.uploadReady = false
      this.$nextTick(() => {
        this.uploadReady = true
      })
    },
    multiUpload(files) {
      for (const file of files) {
        this.uploadFile(file)
      }
    },
    change({ target }) {
      this.multiUpload(target.files)
    },
  },
  props: {
    dropFiles: Object,
    disabled: Boolean,
    normalButton: Boolean,
    acceptTypes: {
      type: String,
      default: '*/*',
    },
  },
  watch: {
    dropFiles: function (fileInfos) {
      if (!this.uploading) {
        this.multiUpload(fileInfos)
      }
    },
  },
}

export default mediaUpload
