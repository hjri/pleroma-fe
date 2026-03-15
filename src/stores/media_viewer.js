import { defineStore } from 'pinia'

const supportedTypes = new Set(['image', 'video', 'audio', 'flash'])

export const useMediaViewerStore = defineStore('mediaViewer', {
  state: () => ({
    media: [],
    currentIndex: 0,
    activated: false,
  }),
  actions: {
    setMedia(attachments) {
      const media = attachments.filter((attachment) => {
        return supportedTypes.has(attachment.type)
      })

      this.media = media
    },
    setCurrentMedia(current) {
      const index = this.media.indexOf(current)
      this.activated = true
      this.currentIndex = index
    },
    closeMediaViewer() {
      this.activated = false
    },
  },
})
