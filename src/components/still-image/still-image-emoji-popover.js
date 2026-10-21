import Popover from 'components/popover/popover.vue'
import SelectComponent from 'components/select/select.vue'
import { mapState } from 'pinia'

import { useAdminSettingsStore } from 'src/stores/admin_settings'
import { useEmojiStore } from 'src/stores/emoji'
import { useInterfaceStore } from 'src/stores/interface'
import { useUsersStore } from 'src/stores/users.js'

export default {
  components: { Popover, SelectComponent },
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
      return useUsersStore().currentUser?.rights.admin
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
      useAdminSettingsStore()
        .addNewEmojiFile({
          packName: this.packName,
          file: this.$attrs.src,
          shortcode: this.shortcode,
          filename: '',
        })
        .then(({ data: resp }) => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'admin_dash.emoji.copied_successfully',
            messageArgs: [this.shortcode, this.packName],
            level: 'success',
          })

          this.$refs.emojiPopover.hidePopover()
          this.packName = ''
        })
        .catch((e) => {
          this.displayError(e)
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
