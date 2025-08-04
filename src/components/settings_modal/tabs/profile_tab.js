import UserCard from 'src/components/user_card/user_card.vue'
import ImageCropper from 'src/components/image_cropper/image_cropper.vue'
import ScopeSelector from 'src/components/scope_selector/scope_selector.vue'
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

library.add(
  faTimes,
  faPlus,
  faCircleNotch
)

const ProfileTab = {
  data () {
    return {
      locked: this.$store.state.users.currentUser.locked,
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
