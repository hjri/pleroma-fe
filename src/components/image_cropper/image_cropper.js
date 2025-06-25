import 'cropperjs' // This adds all of the cropperjs's components into DOM
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faCircleNotch
)

const ImageCropper = {
  props: {
    trigger: {
      type: [String, window.Element],
      required: true
    },
    submitHandler: {
      type: Function,
      required: true
    },
    mimes: {
      type: String,
      default: 'image/png, image/gif, image/jpeg, image/bmp, image/x-icon'
    },
    saveButtonLabel: {
      type: String
    },
    saveWithoutCroppingButtonlabel: {
      type: String
    },
    cancelButtonLabel: {
      type: String
    }
  },
  data () {
    return {
      dataUrl: undefined,
      filename: undefined,
      submitting: false
    }
  },
  computed: {
    saveText () {
      return this.saveButtonLabel || this.$t('image_cropper.save')
    },
    saveWithoutCroppingText () {
      return this.saveWithoutCroppingButtonlabel || this.$t('image_cropper.save_without_cropping')
    },
    cancelText () {
      return this.cancelButtonLabel || this.$t('image_cropper.cancel')
    }
  },
  methods: {
    destroy () {
      this.$refs.input.value = ''
      this.dataUrl = undefined
      this.$emit('close')
    },
    submit (cropping = true) {
      this.submitting = true

      let cropperPromise
      if (cropping) {
        cropperPromise = this.$refs.cropperSelection.$toCanvas()
      } else {
        cropperPromise = Promise.resolve()
      }
      cropperPromise.then(canvas => {
        this.submitHandler(canvas, this.file)
            .then(() => this.destroy())
            .finally(() => {
              this.submitting = false
            })
      })
    },
    pickImage () {
      this.$refs.input.click()
    },
    getTriggerDOM () {
      return typeof this.trigger === 'object' ? this.trigger : document.querySelector(this.trigger)
    },
    readFile () {
      const fileInput = this.$refs.input
      if (fileInput.files != null && fileInput.files[0] != null) {
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
        selection.x >= maxSelection.x
        && selection.y >= maxSelection.y
        && (selection.x + selection.width) <= (maxSelection.x + maxSelection.width)
        && (selection.y + selection.height) <= (maxSelection.y + maxSelection.height)
      )
    },
    onCropperSelectionChange(event) {
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
        event.preventDefault();
      }
    }
  },
  mounted () {
    // listen for click event on trigger
    const trigger = this.getTriggerDOM()
    if (!trigger) {
      this.$emit('error', 'No image make trigger found.', 'user')
    } else {
      trigger.addEventListener('click', this.pickImage)
    }
    // listen for input file changes
    const fileInput = this.$refs.input
    fileInput.addEventListener('change', this.readFile)
  },
  beforeUnmount: function () {
    // remove the event listeners
    const trigger = this.getTriggerDOM()
    if (trigger) {
      trigger.removeEventListener('click', this.pickImage)
    }
    const fileInput = this.$refs.input
    fileInput.removeEventListener('change', this.readFile)
  }
}

export default ImageCropper
