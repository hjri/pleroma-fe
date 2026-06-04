import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Popover from 'src/components/popover/popover.vue'
import VideoAttachment from 'src/components/video_attachment/video_attachment.vue'
import nsfwImage from '../../assets/nsfw.png'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMediaViewerStore } from 'src/stores/media_viewer'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAlignRight,
  faFile,
  faImage,
  faMusic,
  faPencilAlt,
  faPlayCircle,
  faSearchPlus,
  faStop,
  faTimes,
  faTrashAlt,
  faVideo,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faFile,
  faMusic,
  faImage,
  faVideo,
  faPlayCircle,
  faTimes,
  faStop,
  faSearchPlus,
  faTrashAlt,
  faPencilAlt,
  faAlignRight,
)

const Attachment = {
  props: [
    'attachment',
    'compact',
    'description',
    'hideDescription',
    'nsfw',
    'size',
    'setMedia',
    'remove',
    'shiftUp',
    'shiftDn',
    'edit',
  ],
  data() {
    return {
      localDescription: this.description || this.attachment.description,
      nsfwImage:
        useInstanceStore().instanceIdentity.nsfwCensorImage || nsfwImage,
      hideNsfwLocal: useMergedConfigStore().mergedConfig.hideNsfw,
      preloadImage: useMergedConfigStore().mergedConfig.preloadImage,
      loading: false,
      img: this.attachment.type === 'image' && document.createElement('img'),
      modalOpen: false,
      showHidden: false,
      flashLoaded: false,
    }
  },
  components: {
    Flash: defineAsyncComponent(() => import('src/components/flash/flash.vue')),

    VideoAttachment: defineAsyncComponent(
      () => import('src/components/video_attachment/video_attachment.vue'),
    ),
    Popover,
  },
  computed: {
    classNames() {
      return [
        {
          '-loading': this.loading,
          '-nsfw-placeholder': this.hidden,
          '-editable': this.edit !== undefined,
          '-compact': this.compact,
        },
        '-type-' + this.attachment.type,
        this.size && '-size-' + this.size,
        `-${this.useContainFit ? 'contain' : 'cover'}-fit`,
      ]
    },
    usePlaceholder() {
      return this.size === 'hide'
    },
    useContainFit() {
      return this.mergedConfig.useContainFit
    },
    placeholderName() {
      if (this.attachment.description === '' || !this.attachment.description) {
        return this.attachment.type.toUpperCase()
      }
      return this.attachment.description
    },
    placeholderIconClass() {
      if (this.attachment.type === 'image') return 'image'
      if (this.attachment.type === 'video') return 'video'
      if (this.attachment.type === 'audio') return 'music'
      return 'file'
    },
    referrerpolicy() {
      return useInstanceCapabilitiesStore().mediaProxyAvailable
        ? ''
        : 'no-referrer'
    },
    hidden() {
      return this.nsfw && this.hideNsfwLocal && !this.showHidden
    },
    isEmpty() {
      return this.attachment.type === 'html' && !this.attachment.oembed
    },
    useModal() {
      let modalTypes = []
      switch (this.size) {
        case 'hide':
        case 'small':
          modalTypes = ['image', 'video', 'audio', 'flash']
          break
        default:
          modalTypes = this.mergedConfig.playVideosInModal
            ? ['image', 'video', 'flash']
            : ['image']
          break
      }
      return modalTypes.includes(this.attachment.type)
    },
    videoTag() {
      return this.useModal ? 'button' : 'span'
    },
    ...mapState(useMergedConfigStore, ['mergedConfig']),
  },
  watch: {
    'attachment.description'(newVal) {
      this.localDescription = newVal
    },
    localDescription(newVal) {
      this.onEdit(newVal)
    },
  },
  methods: {
    linkClicked({ target }) {
      if (target.tagName === 'A') {
        window.open(target.href, '_blank')
      }
    },
    openModal() {
      if (this.useModal) {
        this.$emit('setMedia')
        useMediaViewerStore().setCurrentMedia(this.attachment)
      } else if (this.attachment.type === 'unknown') {
        window.open(this.attachment.url)
      }
    },
    openModalForce() {
      this.$emit('setMedia')
      useMediaViewerStore().setCurrentMedia(this.attachment)
    },
    onEdit(event) {
      this.edit && this.edit(this.attachment, event)
    },
    onRemove() {
      this.remove && this.remove(this.attachment)
    },
    onShiftUp() {
      this.shiftUp && this.shiftUp(this.attachment)
    },
    onShiftDn() {
      this.shiftDn && this.shiftDn(this.attachment)
    },
    stopFlash() {
      this.$refs.flash.closePlayer()
    },
    setFlashLoaded(event) {
      this.flashLoaded = event
    },
    toggleHidden(event) {
      if (
        this.mergedConfig.useOneClickNsfw &&
        !this.showHidden &&
        (this.attachment.type !== 'video' ||
          this.mergedConfig.playVideosInModal)
      ) {
        this.openModal(event)
        return
      }
      if (this.img && !this.preloadImage) {
        if (this.img.onload) {
          this.img.onload()
        } else {
          this.loading = true
          this.img.src = this.attachment.url
          this.img.onload = () => {
            this.loading = false
            this.showHidden = !this.showHidden
          }
        }
      } else {
        this.showHidden = !this.showHidden
      }
    },
    onImageLoad(image) {
      const width = image.naturalWidth
      const height = image.naturalHeight
      this.$emit('naturalSizeLoad', { id: this.attachment.id, width, height })
    },
  },
}

export default Attachment
