import Modal from 'src/components/modal/modal.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import pleromaTanMask from 'src/assets/pleromatan_apology_mask.png'
import pleromaTanFoxMask from 'src/assets/pleromatan_apology_fox_mask.png'

import { useServerSideStorageStore } from 'src/stores/serverSideStorage'

import {
  faTimes
} from '@fortawesome/free-solid-svg-icons'
library.add(
  faTimes
)

export const CURRENT_UPDATE_COUNTER = 1

const pleromaTan = '/static/pleromatan_apology.png'
const pleromaTanFox = '/static/pleromatan_apology_fox.png'

const UpdateNotification = {
  data () {
    return {
      showingImage: false,
      pleromaTanVariant: Math.random() > 0.5 ? pleromaTan : pleromaTanFox,
      showingMore: false
    }
  },
  components: {
    Modal
  },
  computed: {
    pleromaTanStyles () {
      const mask = this.pleromaTanVariant === pleromaTan ? pleromaTanMask : pleromaTanFoxMask
      return {
        'shape-outside': 'url(' + mask + ')'
      }
    },
    shouldShow () {
      return !this.$store.state.instance.disableUpdateNotification &&
        this.$store.state.users.currentUser &&
        useServerSideStorageStore().flagStorage.updateCounter < CURRENT_UPDATE_COUNTER &&
        !useServerSideStorageStore().prefsStorage.simple.dontShowUpdateNotifs
    }
  },
  methods: {
    toggleShow () {
      this.showingMore = !this.showingMore
    },
    neverShowAgain () {
      this.toggleShow()
      useServerSideStorageStore().setFlag({ flag: 'updateCounter', value: CURRENT_UPDATE_COUNTER })
      useServerSideStorageStore().setPreference({ path: 'simple.dontShowUpdateNotifs', value: true })
      useServerSideStorageStore().pushServerSideStorage()
    },
    dismiss () {
      useServerSideStorageStore().setFlag({ flag: 'updateCounter', value: CURRENT_UPDATE_COUNTER })
      useServerSideStorageStore().pushServerSideStorage()
    }
  },
  mounted () {
    this.contentHeightNoImage = this.$refs.animatedText.scrollHeight

    // Workaround to get the text height only after mask loaded. A bit hacky.
    const newImg = new Image()
    newImg.onload = () => {
      setTimeout(() => { this.showingImage = true }, 100)
    }
    newImg.src = this.pleromaTanVariant === pleromaTan ? pleromaTanMask : pleromaTanFoxMask
  }
}

export default UpdateNotification
