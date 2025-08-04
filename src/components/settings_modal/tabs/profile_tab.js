import unescape from 'lodash/unescape'
import merge from 'lodash/merge'
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
import localeService from 'src/services/locale/locale.service.js'
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
      newName: this.$store.state.users.currentUser.name_unescaped,
      newBio: unescape(this.$store.state.users.currentUser.description),
      newLocked: this.$store.state.users.currentUser.locked,
      newBirthday: this.$store.state.users.currentUser.birthday,
      showBirthday: this.$store.state.users.currentUser.show_birthday,
      newFields: this.$store.state.users.currentUser.fields.map(field => ({ name: field.name, value: field.value })),
      showRole: this.$store.state.users.currentUser.show_role,
      role: this.$store.state.users.currentUser.role,
      bot: this.$store.state.users.currentUser.bot,
      actorType: this.$store.state.users.currentUser.actor_type,
      bannerUploading: false,
      backgroundUploading: false,
      banner: null,
      bannerPreview: null,
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
    groupActorAvailable () {
      return this.$store.state.instance.groupActorAvailable
    },
    availableActorTypes () {
      return this.groupActorAvailable ? ['Person', 'Service', 'Group'] : ['Person', 'Service']
    }
  },
  methods: {
    updateProfile () {
      const params = {
        note: this.newBio,
        locked: this.newLocked,

        // Backend notation.
        display_name: this.newName,
        fields_attributes: this.newFields.filter(el => el != null),
        actor_type: this.actorType,
        show_role: this.showRole,
        birthday: this.newBirthday || '',
        show_birthday: this.showBirthday
      }

      if (this.emailLanguage) {
        params.language = localeService.internalToBackendLocaleMulti(this.emailLanguage)
      }

      this.$store.state.api.backendInteractor
        .updateProfile({ params })
        .then((user) => {
          this.newFields.splice(user.fields.length)
          merge(this.newFields, user.fields)
          this.$store.commit('addNewUsers', [user])
          this.$store.commit('setCurrentUser', user)
        })
    },
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
    displayUploadError (error) {
      useInterfaceStore().pushGlobalNotice({
        messageKey: 'upload.error.message',
        messageArgs: [error.message],
        level: 'error'
      })
    },
    propsToNative (props) {
      return propsToNative(props)
    }
  }
}

export default ProfileTab
