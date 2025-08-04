import UserCard from 'src/components/user_card/user_card.vue'
import ImageCropper from 'src/components/image_cropper/image_cropper.vue'
import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'
import fileSizeFormatService from 'src/components/../services/file_size_format/file_size_format.js'
import ProgressButton from 'src/components/progress_button/progress_button.vue'
import EmojiInput from 'src/components/emoji_input/emoji_input.vue'
import suggestor from 'src/components/emoji_input/suggestor.js'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import InterfaceLanguageSwitcher from 'src/components/interface_language_switcher/interface_language_switcher.vue'
import Select from 'src/components/select/select.vue'
import BooleanSetting from '../helpers/boolean_setting.vue'
import SharedComputedObject from '../helpers/shared_computed_object.js'
import ProfileSettingIndicator from '../helpers/profile_setting_indicator.vue'

import { propsToNative } from 'src/services/attributes_helper/attributes_helper.service.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTimes,
  faPlus,
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons'
import { useInterfaceStore } from 'src/stores/interface'

library.add(
  faTimes,
  faPlus,
  faCircleNotch
)

const ProfileTab = {
  data () {
    return {
      locked: this.$store.state.users.currentUser.locked,
      backgroundUploading: false,
      background: null,
      backgroundPreview: null,
      emailLanguage: this.$store.state.users.currentUser.language || ['']
    }
  },
  components: {
    UserCard,
    ScopeSelector,
    ImageCropper,
    EmojiInput,
    ProgressButton,
    Checkbox,
    BooleanSetting,
    InterfaceLanguageSwitcher,
    ProfileSettingIndicator,
    Select
  },
  computed: {
    user () {
      return this.$store.state.users.currentUser
    },
    ...SharedComputedObject(),
    emojiUserSuggestor () {
      return suggestor({
        emoji: [
          ...this.$store.getters.standardEmojiList,
          ...this.$store.state.instance.customEmoji
        ],
        store: this.$store
      })
    },
    emojiSuggestor () {
      return suggestor({
        emoji: [
          ...this.$store.getters.standardEmojiList,
          ...this.$store.state.instance.customEmoji
        ]
      })
    },
    userSuggestor () {
      return suggestor({ store: this.$store })
    },
    bannerImgSrc () {
      const src = this.$store.state.users.currentUser.cover_photo
      return (!src) ? this.defaultBanner : src
    },
  },
  methods: {
    changeVis (visibility) {
      this.newDefaultScope = visibility
    },
    uploadFile (slot, e) {
      const file = e.target.files[0]
      if (!file) { return }
      if (file.size > this.$store.state.instance[slot + 'limit']) {
        const filesize = fileSizeFormatService.fileSizeFormat(file.size)
        const allowedsize = fileSizeFormatService.fileSizeFormat(this.$store.state.instance[slot + 'limit'])
        useInterfaceStore().pushGlobalNotice({
          messageKey: 'upload.error.message',
          messageArgs: [
            this.$t('upload.error.file_too_big', {
              filesize: filesize.num,
              filesizeunit: filesize.unit,
              allowedsize: allowedsize.num,
              allowedsizeunit: allowedsize.unit
            })
          ],
          level: 'error'
        })
        return
      }

      const reader = new FileReader()
      reader.onload = ({ target }) => {
        const img = target.result
        this[slot + 'Preview'] = img
        this[slot] = file
      }
      reader.readAsDataURL(file)
    },
    resetBackground () {
      const confirmed = window.confirm(this.$t('settings.reset_background_confirm'))
      if (confirmed) {
        this.submitBackground('')
      }
    },
    submitBackground (background) {
      if (!this.backgroundPreview && background !== '') { return }

      this.backgroundUploading = true
      this.$store.state.api.backendInteractor.updateProfileImages({ background })
        .then((data) => {
          this.$store.commit('addNewUsers', [data])
          this.$store.commit('setCurrentUser', data)
          this.backgroundPreview = null
        })
        .catch(this.displayUploadError)
        .finally(() => { this.backgroundUploading = false })
    },
    updateProfile () {
      const params = {
        locked: this.locked
      }

      this.$store.state.api.backendInteractor
        .updateProfile({ params })
        .then((user) => {
          this.$store.commit('addNewUsers', [user])
          this.$store.commit('setCurrentUser', user)
        })
        .catch((error) => {
          this.displayUploadError(error)
        })
    },
    propsToNative (props) {
      return propsToNative(props)
    }
  },
  watch: {
    locked () {
      this.updateProfile()
    }
  }
}

export default ProfileTab
