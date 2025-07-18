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

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'
import { mapGetters } from 'vuex'
import { usePostStatusStore } from 'src/stores/post_status'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBell,
  faRss,
  faSearchPlus,
  faExternalLinkAlt,
  faEdit,
  faTimes,
  faExpandAlt
} from '@fortawesome/free-solid-svg-icons'

import { useMediaViewerStore } from '../../stores/media_viewer'
import { useInterfaceStore } from '../../stores/interface'

library.add(
  faRss,
  faBell,
  faSearchPlus,
  faExternalLinkAlt,
  faEdit,
  faTimes,
  faExpandAlt
)

export default {
  props: [
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
    UserAvatar,
    RemoteFollow,
    ModerationTools,
    AccountActions,
    ProgressButton,
    FollowButton,
    Select,
    RichContent,
    UserLink,
    UserNote,
    UserTimedFilterModal
  },
  data () {
    return {
      followRequestInProgress: false,
      muteExpiryAmount: 0,
      muteExpiryUnit: 'minutes'
    }
  },
  created () {
    this.$store.dispatch('fetchUserRelationship', this.user.id)
  },
  computed: {
    user () {
      return this.$store.getters.findUser(this.userId)
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
          `url(${this.user.cover_photo})`
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
    }
  }
}
