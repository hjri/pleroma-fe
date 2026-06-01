import Popover from 'components/popover/popover.vue'
import SelectComponent from 'components/select/select.vue'
import { mapState } from 'pinia'

import StillImage from './still-image.vue'

import { useEmojiStore } from 'src/stores/emoji'
import { useInterfaceStore } from 'src/stores/interface'

export default {
  components: { StillImage, Popover, SelectComponent },
  props: {
    shortcode: {
      type: String,
      required: true,
    },
    isLocal: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      packName: '',
    }
  },
  computed: {
    isUserAdmin() {
      return this.$store.state.users.currentUser?.rights.admin
    },
    ...mapState(useEmojiStore, ['adminPacksLocal', 'adminPacksLocalLoading']),
  },
  methods: {
    displayError(msg) {
      useInterfaceStore().pushGlobalNotice({
        messageKey: 'admin_dash.emoji.error',
        messageArgs: [msg],
        level: 'error',
      })
    },
    copyToLocalPack() {
      this.$store.state.api.backendInteractor
        .addNewEmojiFile({
          packName: this.packName,
          file: this.$attrs.src,
          shortcode: this.shortcode,
          filename: '',
        })
        .then((resp) => resp.json())
        .then((resp) => {
          if (resp.error !== undefined) {
            this.displayError(resp.error)
            return
          }
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'admin_dash.emoji.copied_successfully',
            messageArgs: [this.shortcode, this.packName],
            level: 'success',
          })

          this.$refs.emojiPopover.hidePopover()
          this.packName = ''
        })
    },

    fetchEmojiPacksIfAdmin() {
      useEmojiStore()
        .getAdminPacksLocal()
        .then(() => {
          this.$refs.emojiPopover.updateStyles()
        })
    },
  },
}
