import 'cropperjs' // This adds all of the cropperjs's components into DOM

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const ImageCropper = {
  props: {
    // Mime-types to accept, i.e. which filetypes to accept (.gif, .png, etc.)
    mimes: {
      type: String,
      default: 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon',
    },
    // Fixed aspect-ratio for selection box
    aspectRatio: {
      type: Number,
    },
  },
  data() {
    return {
      dataUrl: undefined,
      filename: undefined,
    }
  },
  emits: [
    'submit', // cropping complete or uncropped image returned
    'close', // cropper is closed
  ],
  methods: {
    destroy() {
      this.$refs.input.value = ''
      this.dataUrl = undefined
      this.$emit('close')
    },
    submit(cropping = true) {
      let cropperPromise
      if (cropping) {
        cropperPromise = this.$refs.cropperSelection.$toCanvas()
      } else {
        cropperPromise = Promise.resolve()
      }

      cropperPromise.then((canvas) => {
        this.$emit('submit', { canvas, file: this.file })
      })
    },
    pickImage() {
      this.$refs.input.click()
    },
    readFile() {
      const fileInput = this.$refs.input
      if (fileInput?.files?.[0]) {
        this.file = fileInput.files[0]
        const reader = new window.FileReader()
        reader.onload = (e) => {
          this.dataUrl = e.target.result
          this.$emit('open')
        }
        reader.readAsDataURL(this.file)
        this.$emit('changed', this.file, reader)
      }
    },
    inSelection(selection, maxSelection) {
      return (
        selection.x >= maxSelection.x &&
        selection.y >= maxSelection.y &&
        selection.x + selection.width <= maxSelection.x + maxSelection.width &&
        selection.y + selection.height <= maxSelection.y + maxSelection.height
      )
    },
    onCropperSelectionChange(event) {
      if (!this.$refs.cropperCanvas) {
        return // Cropper sends even before component is fully initialized
      }
      const cropperCanvas = this.$refs.cropperCanvas
      const cropperCanvasRect = cropperCanvas.getBoundingClientRect()
      const selection = event.detail
      const maxSelection = {
        x: 0,
        y: 0,
        width: cropperCanvasRect.width,
        height: cropperCanvasRect.height,
      }

      if (!this.inSelection(selection, maxSelection)) {
        event.preventDefault()
      }
    },
  },
  mounted() {
    // listen for input file changes
    const fileInput = this.$refs.input
    fileInput.addEventListener('change', this.readFile)
  },
  beforeUnmount: function () {
    const fileInput = this.$refs.input
    fileInput.removeEventListener('change', this.readFile)
  },
}

export default ImageCropper
