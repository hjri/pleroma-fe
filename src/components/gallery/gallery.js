import { set, sumBy } from 'lodash'

import Attachment from 'src/components/attachment/attachment.vue'

import { useMediaViewerStore } from 'src/stores/media_viewer.js'

const displayTypes = new Set(['image', 'video', 'flash'])

const Gallery = {
  props: [
    'attachments',
    'compact',
    'limitRows',
    'descriptions',
    'limit',
    'nsfw',
    'setMedia',
    'size',
    'editable',
    'removeAttachment',
    'shiftUpAttachment',
    'shiftDnAttachment',
    'editAttachment',
    'grid',
  ],
  data() {
    return {
      sizes: {},
      hidingLong: true,
      playingMedia: new Set(),
    }
  },
  emits: ['play', 'pause'],
  components: { Attachment },
  computed: {
    rows() {
      if (!this.attachments) {
        return []
      }
      const attachments =
        this.limit > 0
          ? this.attachments.slice(0, this.limit)
          : this.attachments
      if (this.size === 'hide') {
        return attachments.map((item) => ({ minimal: true, items: [item] }))
      }
      const rows = this.grid
        ? [{ grid: true, items: attachments }]
        : attachments
            .reduce(
              (acc, attachment, i) => {
                const peek = attachments[i + 1]
                const nextEnd = peek == null
                const nextWide = !nextEnd && !displayTypes.has(peek?.type)

                // Inserting new row
                if (attachment.type === 'audio') {
                  return [
                    ...acc,
                    { audio: true, items: [attachment] },
                    { items: [] },
                  ]
                }
                if (!displayTypes.has(attachment.type)) {
                  return [
                    ...acc,
                    { minimal: true, items: [attachment] },
                    { items: [] },
                  ]
                }

                const maxPerRow = 3
                const currentRow = acc[acc.length - 1]
                const previousRow = acc[acc.length - 2]

                if (currentRow.items.length >= maxPerRow) {
                  if (nextWide || nextEnd) {
                    if (previousRow?.items.length > 1) {
                      currentRow.items.push(attachment)
                      return [...acc, { items: [] }]
                    } else {
                      const last = currentRow.items.splice(-1)[0]
                      return [...acc, { items: [last, attachment] }]
                    }
                  } else {
                    return [...acc, { items: [attachment] }]
                  }
                } else {
                  currentRow.items.push(attachment)
                }
                return acc
              },
              [{ items: [] }],
            )
            .filter((_) => _.items.length > 0)
      return rows
    },
    attachmentsDimensionalScore() {
      return this.rows.reduce((acc, row) => {
        let size = 0
        if (row.minimal) {
          size += 1 / 8
        } else if (row.audio) {
          size += 1 / 4
        } else {
          size += 1 / (row.items.length + 0.6)
        }
        return acc + size
      }, 0)
    },
    tooManyAttachments() {
      if (this.editable || this.size === 'small') {
        return false
      } else if (this.size === 'hide') {
        return this.attachments.length > 8
      } else {
        return this.attachmentsDimensionalScore > 1
      }
    },
    hasPlayingMedia() {
      return this.playingMedia.size > 0
    },
  },
  methods: {
    onNaturalSizeLoad({ id, width, height }) {
      set(this.sizes, id, { width, height })
    },
    onMediaStateChange(playing, id) {
      if (playing) {
        this.playingMedia.add(id)
      } else {
        this.playingMedia.delete(id)
      }
    },
    rowStyle(row) {
      if (row.audio) {
        return { 'padding-bottom': '25%' } // fixed reduced height for audio
      } else if (!row.minimal && !row.grid) {
        return { 'padding-bottom': `${100 / (row.items.length + 0.6)}%` }
      }
    },
    itemStyle(id, row) {
      const total = sumBy(row, (item) => this.getAspectRatio(item.id))
      return { flex: `${this.getAspectRatio(id) / total} 1 0%` }
    },
    getAspectRatio(id) {
      const size = this.sizes[id]
      return size ? size.width / size.height : 1
    },
    toggleHidingLong(event) {
      this.hidingLong = event
    },
    openGallery() {
      useMediaViewerStore().setMedia(this.attachments)
      useMediaViewerStore().setCurrentMedia(this.attachments[0])
    },
    onMedia() {
      useMediaViewerStore().setMedia(this.attachments)
    },
  },
  watch: {
    hasPlayingMedia(newValue) {
      if (newValue) {
        this.$emit('play')
      } else {
        this.$emit('pause')
      }
    },
  },
}

export default Gallery
