import isEqual from 'lodash/isEqual'
import merge from 'lodash/merge'
import ldUnescape from 'lodash/unescape'
import { mapState } from 'pinia'

import Checkbox from 'src/components/checkbox/checkbox.vue'
import ColorInput from 'src/components/color_input/color_input.vue'
import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'
import EmojiInput from 'src/components/emoji_input/emoji_input.vue'
import suggestor from 'src/components/emoji_input/suggestor.js'
import ImageCropper from 'src/components/image_cropper/image_cropper.vue'
import RichContent from 'src/components/rich_content/rich_content.jsx'
import UserTimedFilterModal from 'src/components/user_timed_filter_modal/user_timed_filter_modal.vue'
import { useInterfaceStore } from '../../stores/interface'
import { useMediaViewerStore } from '../../stores/media_viewer'
import AccountActions from '../account_actions/account_actions.vue'
import FollowButton from '../follow_button/follow_button.vue'
import ModerationTools from '../moderation_tools/moderation_tools.vue'
import ProgressButton from '../progress_button/progress_button.vue'
import RemoteFollow from '../remote_follow/remote_follow.vue'
import Select from '../select/select.vue'
import UserAvatar from '../user_avatar/user_avatar.vue'
import UserLink from '../user_link/user_link.vue'
import UserNote from '../user_note/user_note.vue'

import { useEmojiStore } from 'src/stores/emoji.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { usePostStatusStore } from 'src/stores/post_status'
import { useSyncConfigStore } from 'src/stores/sync_config.js'

import { propsToNative } from 'src/services/attributes_helper/attributes_helper.service.js'
import localeService from 'src/services/locale/locale.service.js'
import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faBirthdayCake,
  faClockRotateLeft,
  faEdit,
  faExpandAlt,
  faExternalLinkAlt,
  faRss,
  faSave,
  faSearchPlus,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

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
  faClockRotateLeft,
)

export default {
  props: {
    // Enables all the options for profile editing, used in settings -> profile tab
    editable: {
      required: false,
      default: false,
      type: Boolean,
    },
    // ID of user to show data of
    userId: {
      required: true,
      type: String,
    },
    // Use a compact layout that hides bio, stats etc.
    hideBio: {
      required: false,
      default: false,
      type: Boolean,
    },
    // default - open profile, 'zoom' - zoom, function - call function
    avatarAction: {
      required: false,
      type: String,
      default: 'default',
    },
    // Show note editor if supported
    hasNoteEditor: {
      required: false,
      type: Boolean,
      default: false,
    },
    // Show close icon (for popovers)
    showClose: {
      required: false,
      type: Boolean,
      default: false,
    },
    // Show close icon (for popovers)
    showExpand: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
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
    ImageCropper,
  },
  data() {
    const user = this.$store.getters.findUser(this.userId)

    return {
      followRequestInProgress: false,

      // Editable stuff
      editImage: false,

      newName: user.name_unescaped,
      editingName: false,

      newBio: ldUnescape(user.description),
      editingBio: false,

      newAvatar: null,
      newAvatarFile: null,

      newBanner: null,
      newBannerFile: null,

      newActorType: user.actor_type,
      newBirthday: user.birthday,
      newShowBirthday: user.show_birthday,
      newShowRole: user.show_role,

      newFields: user.fields?.map((field) => ({
        name: field.name,
        value: field.value,
      })),

      editingFields: false,
    }
  },
  created() {
    this.$store.dispatch('fetchUserRelationship', this.user.id)
  },
  computed: {
    somethingToSave() {
      if (this.newName !== this.user.name_unescaped) return true
      if (this.newBio !== ldUnescape(this.user.description)) return true
      if (this.newAvatar !== null) return true
      if (this.newBanner !== null) return true
      if (this.newActorType !== this.user.actor_type) return true
      if (this.newBirthday !== this.user.birthday) return true
      if (this.newShowBirthday !== this.user.show_birthday) return true
      if (this.newShowRole !== this.user.show_role) return true
      if (
        !isEqual(
          this.newFields,
          this.user.fields?.map((field) => ({
            name: field.name,
            value: field.value,
          })),
        )
      )
        return true
      return false
    },
    groupActorAvailable() {
      return useInstanceCapabilitiesStore().groupActorAvailable
    },
    availableActorTypes() {
      return this.groupActorAvailable
        ? ['Person', 'Service', 'Group']
        : ['Person', 'Service']
    },
    user() {
      return this.$store.getters.findUser(this.userId)
    },
    role() {
      return this.user.role
    },
    relationship() {
      return this.$store.getters.relationship(this.userId)
    },
    isOtherUser() {
      return this.user.id !== this.$store.state.users.currentUser.id
    },
    subscribeUrl() {
      const serverUrl = new URL(this.user.statusnet_profile_url)
      return `${serverUrl.protocol}//${serverUrl.host}/main/ostatus`
    },
    loggedIn() {
      return this.$store.state.users.currentUser
    },
    dailyAvg() {
      const days = Math.ceil(
        (new Date() - new Date(this.user.created_at)) / (60 * 60 * 24 * 1000),
      )
      return Math.round(this.user.statuses_count / days)
    },
    emoji() {
      return useEmojiStore().customEmoji.map((e) => ({
        shortcode: e.displayText,
        static_url: e.imageUrl,
        url: e.imageUrl,
      }))
    },
    userHighlightType: {
      get() {
        const data =
          useSyncConfigStore().mergedConfig.highlight[this.user.screen_name]
        return (data && data.type) || 'disabled'
      },
      set(type) {
        const data =
          useSyncConfigStore().mergedConfig.highlight[this.user.screen_name]
        if (type !== 'disabled') {
          this.$store.dispatch('setHighlight', {
            user: this.user.screen_name,
            color: (data && data.color) || '#FFFFFF',
            type,
          })
        } else {
          this.$store.dispatch('setHighlight', {
            user: this.user.screen_name,
            color: undefined,
          })
        }
      },
      ...mapState(useSyncConfigStore, ['mergedConfig']),
    },
    userHighlightColor: {
      get() {
        const data =
          useSyncConfigStore().mergedConfig.highlight[this.user.screen_name]
        return data && data.color
      },
      set(color) {
        this.$store.dispatch('setHighlight', {
          user: this.user.screen_name,
          color,
        })
      },
    },
    visibleRole() {
      if (!this.newShowRole) {
        return
      }
      const rights = this.user.rights
      if (!rights) {
        return
      }
      const validRole = rights.admin || rights.moderator
      const roleTitle = rights.admin ? 'admin' : 'moderator'
      return validRole && roleTitle
    },
    hideFollowsCount() {
      return this.isOtherUser && this.user.hide_follows_count
    },
    hideFollowersCount() {
      return this.isOtherUser && this.user.hide_followers_count
    },
    showModerationMenu() {
      const privileges = this.loggedIn.privileges
      return (
        this.loggedIn.role === 'admin' ||
        privileges.includes('users_manage_activation_state') ||
        privileges.includes('users_delete') ||
        privileges.includes('users_manage_tags')
      )
    },
    hasNote() {
      return this.relationship.note
    },
    supportsNote() {
      return 'note' in this.relationship
    },
    muteExpiryAvailable() {
      return Object.hasOwn(this.user, 'mute_expires_at')
    },
    muteExpiry() {
      return this.user.mute_expires_at === false
        ? this.$t('user_card.mute_expires_forever')
        : this.$t('user_card.mute_expires_at', [
            new Date(this.user.mute_expires_at).toLocaleString(),
          ])
    },
    blockExpiryAvailable() {
      return Object.hasOwn(this.user, 'block_expires_at')
    },
    blockExpiry() {
      return this.user.block_expires_at == null
        ? this.$t('user_card.block_expires_forever')
        : this.$t('user_card.block_expires_at', [
            new Date(this.user.mute_expires_at).toLocaleString(),
          ])
    },
    formattedBirthday() {
      const browserLocale = localeService.internalToBrowserLocale(
        this.$i18n.locale,
      )
      return (
        this.user.birthday &&
        new Date(Date.parse(this.user.birthday)).toLocaleDateString(
          browserLocale,
          { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' },
        )
      )
    },

    // Editable stuff
    avatarImgSrc() {
      const currentUrl =
        this.user.profile_image_url_original || this.defaultAvatar
      if (!this.editable) return currentUrl
      const newUrl =
        this.newAvatar === null ? this.defaultAvatar : this.newAvatar
      return this.newAvatar === null ? currentUrl : newUrl
    },
    bannerImgSrc() {
      const currentUrl = this.user.cover_photo || this.defaultBanner
      if (!this.editable) return currentUrl
      const newUrl =
        this.newBanner === null ? this.defaultBanner : this.newBanner
      return this.newBanner === null ? currentUrl : newUrl
    },
    defaultAvatar() {
      return (
        useInstanceStore().server +
        useInstanceStore().instanceIdentity.defaultAvatar
      )
    },
    defaultBanner() {
      return (
        useInstanceStore().server +
        useInstanceStore().instanceIdentity.defaultBanner
      )
    },
    isDefaultAvatar() {
      const baseAvatar = useInstanceStore().defaultAvatar
      return (
        !this.$store.state.users.currentUser.profile_image_url ||
        this.$store.state.users.currentUser.profile_image_url.includes(
          baseAvatar,
        )
      )
    },
    isDefaultBanner() {
      const baseBanner = useInstanceStore().defaultBanner
      return (
        !this.$store.state.users.currentUser.cover_photo ||
        this.$store.state.users.currentUser.cover_photo.includes(baseBanner)
      )
    },
    fieldsLimits() {
      return useInstanceStore().limits.fieldsLimits
    },
    maxFields() {
      return this.fieldsLimits ? this.fieldsLimits.maxFields : 0
    },
    emojiUserSuggestor() {
      return suggestor({
        emoji: [
          ...useEmojiStore().standardEmojiList,
          ...useEmojiStore().customEmoji,
        ],
        store: this.$store,
      })
    },
    emojiSuggestor() {
      return suggestor({
        emoji: [
          ...useEmojiStore().standardEmojiList,
          ...useEmojiStore().customEmoji,
        ],
      })
    },
    ...mapState(useSyncConfigStore, ['mergedConfig']),
  },
  methods: {
    muteUser() {
      this.$refs.timedMuteDialog.optionallyPrompt()
    },
    unmuteUser() {
      this.$store.dispatch('unmuteUser', this.user.id)
    },
    subscribeUser() {
      return this.$store.dispatch('subscribeUser', this.user.id)
    },
    unsubscribeUser() {
      return this.$store.dispatch('unsubscribeUser', this.user.id)
    },
    linkClicked({ target }) {
      if (target.tagName === 'SPAN') {
        target = target.parentNode
      }
      if (target.tagName === 'A') {
        window.open(target.href, '_blank')
      }
    },
    userProfileLink(user) {
      return generateProfileLink(
        user.id,
        user.screen_name,
        useInstanceStore().restrictedNicknames,
      )
    },
    openProfileTab() {
      useInterfaceStore().openSettingsModalTab('profile')
    },
    zoomAvatar() {
      const attachment = {
        url: this.user.profile_image_url_original,
        mimetype: 'image',
      }
      useMediaViewerStore().setMedia([attachment])
      useMediaViewerStore().setCurrentMedia(attachment)
    },
    mentionUser() {
      usePostStatusStore().openPostStatusModal({
        profileMention: true,
        repliedUser: this.user,
      })
    },
    onAvatarClickHandler(e) {
      if (this.onAvatarClick) {
        e.preventDefault()
        this.onAvatarClick()
      }
    },

    // Editable stuff
    changeAvatar() {
      this.editImage = 'avatar'
    },
    changeBanner() {
      this.editImage = 'banner'
    },
    submitImage({ canvas, file }) {
      if (canvas) {
        return canvas.toBlob((data) =>
          this.submitImage({ canvas: null, file: data }),
        )
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
    resetImage() {
      if (this.editImage === 'avatar') {
        this.newAvatar = null
        this.newAvatarFile = null
      } else {
        this.newBanner = null
        this.newBannerFile = null
      }
      this.editImage = false
    },
    addField() {
      if (this.newFields.length < this.maxFields) {
        this.newFields.push({ name: '', value: '' })
      }
    },
    deleteField(index) {
      this.newFields.splice(index, 1)
    },
    propsToNative(props) {
      return propsToNative(props)
    },
    cancelImageText() {
      return
    },
    resetState() {
      const user = this.$store.state.users.currentUser

      this.newName = user.name_unescaped
      this.newBio = ldUnescape(user.description)

      this.newAvatar = null
      this.newAvatarFile = null

      this.newBanner = null
      this.newBannerFile = null

      this.newActorType = user.actor_type
      this.newBirthday = user.birthday
      this.newShowBirthday = user.show_birthday
      this.newShowRole = user.show_role

      this.newFields = user.fields.map((field) => ({
        name: field.name,
        value: field.value,
      }))
    },
    updateProfile() {
      const params = {
        note: this.newBio,

        // Backend notation.
        display_name: this.newName,
        fields_attributes: this.newFields.filter((el) => el != null),
        show_role: !!this.newShowRole,
        birthday: this.newBirthday || '',
        show_birthday: !!this.newShowBirthday,
      }

      if (this.newActorType) {
        params.actor_type = this.newActorType
      }

      if (this.newAvatarFile !== null) {
        params.avatar = this.newAvatarFile
      }

      if (this.newBannerFile !== null) {
        params.header = this.newBannerFile
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
    displayUploadError(error) {
      useInterfaceStore().pushGlobalNotice({
        messageKey: 'upload.error.message',
        messageArgs: [error.message],
        level: 'error',
      })
    },
  },
}
