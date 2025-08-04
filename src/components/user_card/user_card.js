import merge from 'lodash/merge'
import unescape from 'lodash/unescape'

import ColorInput from 'src/components/color_input/color_input.vue'
import UserAvatar from '../user_avatar/user_avatar.vue'
import RemoteFollow from '../remote_follow/remote_follow.vue'
import ProgressButton from '../progress_button/progress_button.vue'
import FollowButton from '../follow_button/follow_button.vue'
import ModerationTools from '../moderation_tools/moderation_tools.vue'
import AccountActions from '../account_actions/account_actions.vue'
import UserNote from '../user_note/user_note.vue'
import Select from '../select/select.vue'
import UserLink from '../user_link/user_link.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'
import Checkbox from 'src/components/checkbox/checkbox.vue'
import EmojiInput from 'src/components/emoji_input/emoji_input.vue'
import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'
import ImageCropper from 'src/components/image_cropper/image_cropper.vue'

import localeService from 'src/services/locale/locale.service.js'
import suggestor from 'src/components/emoji_input/suggestor.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'
import { mapGetters } from 'vuex'
import { usePostStatusStore } from 'src/stores/post_status'
import { propsToNative } from 'src/services/attributes_helper/attributes_helper.service.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faRss,
  faSearchPlus,
  faExternalLinkAlt,
  faEdit,
  faTimes,
  faExpandAlt,
  faBirthdayCake,
  faSave,
  faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons'

import { useMediaViewerStore } from '../../stores/media_viewer'
import { useInterfaceStore } from '../../stores/interface'

library.add(
  faSave,
  faRss,
  faBell,
  faSearchPlus,
  faExternalLinkAlt,
  faEdit,
  faTimes,
  faExpandAlt,
  faBirthdayCake,
  faClockRotateLeft
)

export default {
  props: [
    'editable',
    'userId',
    'switcher',
    'selected',
    'hideBio',
    'rounded',
    'bordered',
    'avatarAction', // default - open profile, 'zoom' - zoom, function - call function
    'onClose',
    'hasNoteEditor'
  ],
  components: {
    DialogModal,
    UserAvatar,
    Checkbox,
    RemoteFollow,
    ModerationTools,
    AccountActions,
    ProgressButton,
    FollowButton,
    Select,
    RichContent,
    UserLink,
    UserNote,
    UserTimedFilterModal,
    ColorInput,
    EmojiInput,
    ImageCropper
  },
  data () {
    const user = this.$store.getters.findUser(this.userId)

    return {
      followRequestInProgress: false,
      muteExpiryAmount: 0,
      muteExpiryUnit: 'minutes',

      // Editable stuff
      editImage: false,

      newName: user.name_unescaped,
      editingName: false,

      newBio: unescape(user.description),
      editingBio: false,

      newAvatar: null,
      newAvatarFile: null,

      newBanner: null,
      newBannerFile: null,

      newActorType: user.actor_type,
      newBirthday: user.birthday,
      newShowBirthday: user.show_birthday,
      newShowRole: user.show_role,

      newFields: user.fields?.map(field => ({ name: field.name, value: field.value })),
      editingFields: false,
    }
  },
  created () {
    this.$store.dispatch('fetchUserRelationship', this.user.id)
  },
  computed: {
    groupActorAvailable () {
      return this.$store.state.instance.groupActorAvailable
    },
    availableActorTypes () {
      return this.groupActorAvailable ? ['Person', 'Service', 'Group'] : ['Person', 'Service']
    },
    user () {
      return this.$store.getters.findUser(this.userId)
    },
    role () {
      return this.user.role
    },
    relationship () {
      return this.$store.getters.relationship(this.userId)
    },
    classes () {
      return [{
        '-rounded-t': this.rounded === 'top', // set border-top-left-radius and border-top-right-radius
        '-rounded': this.rounded === true, // set border-radius for all sides
        '-bordered': this.bordered === true, // set border for all sides
        '-popover': !!this.onClose // set popover rounding
      }]
    },
    style () {
      return {
        backgroundImage: [
          'linear-gradient(to bottom, var(--profileTint), var(--profileTint))',
          `url(${this.bannerImgSrc})`
        ].join(', ')
      }
    },
    isOtherUser () {
      return this.user.id !== this.$store.state.users.currentUser.id
    },
    subscribeUrl () {
      const serverUrl = new URL(this.user.statusnet_profile_url)
      return `${serverUrl.protocol}//${serverUrl.host}/main/ostatus`
    },
    loggedIn () {
      return this.$store.state.users.currentUser
    },
    dailyAvg () {
      const days = Math.ceil((new Date() - new Date(this.user.created_at)) / (60 * 60 * 24 * 1000))
      return Math.round(this.user.statuses_count / days)
    },
    emoji () {
      return this.$store.state.instance.customEmoji.map(e => ({
        shortcode: e.displayText,
        static_url: e.imageUrl,
        url: e.imageUrl
      }))
    },
    userHighlightType: {
      get () {
        const data = this.$store.getters.mergedConfig.highlight[this.user.screen_name]
        return (data && data.type) || 'disabled'
      },
      set (type) {
        const data = this.$store.getters.mergedConfig.highlight[this.user.screen_name]
        if (type !== 'disabled') {
          this.$store.dispatch('setHighlight', { user: this.user.screen_name, color: (data && data.color) || '#FFFFFF', type })
        } else {
          this.$store.dispatch('setHighlight', { user: this.user.screen_name, color: undefined })
        }
      },
      ...mapGetters(['mergedConfig'])
    },
    userHighlightColor: {
      get () {
        const data = this.$store.getters.mergedConfig.highlight[this.user.screen_name]
        return data && data.color
      },
      set (color) {
        this.$store.dispatch('setHighlight', { user: this.user.screen_name, color })
      }
    },
    visibleRole () {
      if (!this.newShowRole) { return }
      const rights = this.user.rights
      if (!rights) { return }
      const validRole = rights.admin || rights.moderator
      const roleTitle = rights.admin ? 'admin' : 'moderator'
      return validRole && roleTitle
    },
    hideFollowsCount () {
      return this.isOtherUser && this.user.hide_follows_count
    },
    hideFollowersCount () {
      return this.isOtherUser && this.user.hide_followers_count
    },
    showModerationMenu () {
      const privileges = this.loggedIn.privileges
      return this.loggedIn.role === 'admin' ||
        privileges.includes('users_manage_activation_state') ||
        privileges.includes('users_delete') ||
        privileges.includes('users_manage_tags')
    },
    hasNote () {
      return this.relationship.note
    },
    supportsNote () {
      return 'note' in this.relationship
    },
    muteExpiryAvailable () {
      return this.user.mute_expires_at !== undefined
    },
    muteExpiry () {
      return this.user.mute_expires_at == null
        ? this.$t('user_card.mute_expires_forever')
        : this.$t('user_card.mute_expires_at', [new Date(this.user.mute_expires_at).toLocaleString()])
    },
    blockExpiryAvailable () {
      return this.user.block_expires_at !== undefined
    },
    blockExpiry () {
      return this.user.block_expires_at == null
        ? this.$t('user_card.block_expires_forever')
        : this.$t('user_card.block_expires_at', [new Date(this.user.mute_expires_at).toLocaleString()])
    },
    formattedBirthday () {
      const browserLocale = localeService.internalToBrowserLocale(this.$i18n.locale)
      return this.user.birthday && new Date(Date.parse(this.user.birthday)).toLocaleDateString(browserLocale, { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
    },

    // Editable stuff
    avatarImgSrc () {
      const currentUrl = this.user.profile_image_url_original || this.defaultAvatar
      const newUrl = this.newAvatar === '' ? this.defaultAvatar : this.newAvatar
      return (this.newAvatar === null) ? currentUrl : newUrl
    },
    bannerImgSrc () {
      const currentUrl = this.user.cover_photo || this.defaultBanner
      const newUrl = this.newBanner === '' ? this.defaultBanner : this.newBanner
      return (this.newBanner === null) ? currentUrl : newUrl
    },
    defaultAvatar () {
      return this.$store.state.instance.server + this.$store.state.instance.defaultAvatar
    },
    defaultBanner () {
      return this.$store.state.instance.server + this.$store.state.instance.defaultBanner
    },
    isDefaultAvatar () {
      const baseAvatar = this.$store.state.instance.defaultAvatar
      return !(this.$store.state.users.currentUser.profile_image_url) ||
      this.$store.state.users.currentUser.profile_image_url.includes(baseAvatar)
    },
    isDefaultBanner () {
      const baseBanner = this.$store.state.instance.defaultBanner
      return !(this.$store.state.users.currentUser.cover_photo) ||
      this.$store.state.users.currentUser.cover_photo.includes(baseBanner)
    },
    isDefaultBackground () {
      return !(this.$store.state.users.currentUser.background_image)
    },
    fieldsLimits () {
      return this.$store.state.instance.fieldsLimits
    },
    maxFields () {
      return this.fieldsLimits ? this.fieldsLimits.maxFields : 0
    },
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
    ...mapGetters(['mergedConfig'])
  },
  methods: {
    muteUser () {
      this.$refs.timedMuteDialog.optionallyPrompt()
    },
    unmuteUser () {
      this.$store.dispatch('unmuteUser', this.user.id)
    },
    subscribeUser () {
      return this.$store.dispatch('subscribeUser', this.user.id)
    },
    unsubscribeUser () {
      return this.$store.dispatch('unsubscribeUser', this.user.id)
    },
    setProfileView (v) {
      if (this.switcher) {
        const store = this.$store
        store.commit('setProfileView', { v })
      }
    },
    linkClicked ({ target }) {
      if (target.tagName === 'SPAN') {
        target = target.parentNode
      }
      if (target.tagName === 'A') {
        window.open(target.href, '_blank')
      }
    },
    userProfileLink (user) {
      return generateProfileLink(
        user.id, user.screen_name,
        this.$store.state.instance.restrictedNicknames
      )
    },
    openProfileTab () {
      useInterfaceStore().openSettingsModalTab('profile')
    },
    zoomAvatar () {
      const attachment = {
        url: this.user.profile_image_url_original,
        mimetype: 'image'
      }
      useMediaViewerStore().setMedia([attachment])
      useMediaViewerStore().setCurrentMedia(attachment)
    },
    mentionUser () {
      usePostStatusStore().openPostStatusModal({ profileMention: true, repliedUser: this.user })
    },
    onAvatarClickHandler (e) {
      if (this.onAvatarClick) {
        e.preventDefault()
        this.onAvatarClick()
      }
    },

    // Editable stuff
    changeAvatar () {
      this.editImage = 'avatar'
    },
    changeBanner () {
      this.editImage = 'banner'
    },
    submitImage ({ canvas, file }) {
      if (canvas) {
        return canvas.toBlob((data) => this.submitImage({ canvas: null, file: data }))
      }

      const reader = new window.FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result

        if (this.editImage === 'avatar') {
          this.newAvatar = dataUrl
          this.newAvatarFile = file
        } else {
          this.newBanner = dataUrl
          this.newBannerFile = file
        }

        this.editImage = false
      }

      reader.readAsDataURL(file)

    },
    resetImage () {
      if (this.editImage === 'avatar') {
        this.newAvatar = ''
        this.newAvatarFile = ''
      } else {
        this.newBanner = ''
        this.newBannerFile = ''
      }
      this.editImage = false
    },
    addField () {
      if (this.newFields.length < this.maxFields) {
        this.newFields.push({ name: '', value: '' })
        return true
      }
      return false
    },
    deleteField (index) {
      this.newFields.splice(index, 1)
    },
    propsToNative (props) {
      return propsToNative(props)
    },
    cancelImageText () {
      return
    },
    resetState () {
      const user = this.$store.state.users.currentUser

      this.newName = user.name_unescaped
      this.newBio = unescape(user.description)

      this.newAvatar = null
      this.newAvatarFile = null

      this.newBanner = null
      this.newBannerFile = null

      this.newActorType = user.actor_type
      this.newBirthday = user.birthday
      this.newShowBirthday = user.show_birthday
      this.newShowRole = user.show_role

      this.newFields = user.fields.map(field => ({ name: field.name, value: field.value }))
    },
    updateProfile () {
      const params = {
        note: this.newBio,

        // Backend notation.
        display_name: this.newName,
        fields_attributes: this.newFields.filter(el => el != null),
        show_role: !!this.newShowRole,
        birthday: this.newBirthday || '',
        show_birthday: !!this.showBirthday,
      }

      if (this.actorType) {
        params.actor_type = this.actorType
      }

      if (this.newAvatarFile !== null) {
        params.avatar = this.newAvatarFile
      }

      if (this.newBannerFile !== null) {
        params.header = this.newBannerFile
      }

      if (this.emailLanguage) {
        params.language = localeService.internalToBackendLocaleMulti(this.emailLanguage)
      }

      this.$store.state.api.backendInteractor
        .updateProfile({ params })
        .then((user) => {
          this.newFields.splice(this.newFields.length)
          merge(this.newFields, user.fields)
          this.$store.commit('addNewUsers', [user])
          this.$store.commit('setCurrentUser', user)
          this.resetState()
        })
        .catch((error) => {
          this.displayUploadError(error)
        })
    },
    displayUploadError (error) {
      useInterfaceStore().pushGlobalNotice({
        messageKey: 'upload.error.message',
        messageArgs: [error.message],
        level: 'error'
      })
    }
  }
}
