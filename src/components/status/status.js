import { uniqBy } from 'lodash'
import { defineAsyncComponent } from 'vue'

import AvatarList from 'src/components/avatar_list/avatar_list.vue'
import EmojiReactions from 'src/components/emoji_reactions/emoji_reactions.vue'
import MentionLink from 'src/components/mention_link/mention_link.vue'
import MentionsLine from 'src/components/mentions_line/mentions_line.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import StatusActionButtons from 'src/components/status_action_buttons/status_action_buttons.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import StatusPopover from 'src/components/status_popover/status_popover.vue'
import Timeago from 'src/components/timeago/timeago.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserLink from 'src/components/user_link/user_link.vue'
import UserListPopover from 'src/components/user_list_popover/user_list_popover.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'
import { muteFilterHits } from '../../services/status_parser/status_parser.js'
import {
  highlightClass,
  highlightStyle,
} from '../../services/user_highlighter/user_highlighter.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'

import generateProfileLink from 'src/services/user_profile_link_generator/user_profile_link_generator'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAngleDoubleRight,
  faChevronDown,
  faChevronUp,
  faEllipsisH,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobe,
  faIgloo,
  faLock,
  faLockOpen,
  faPlay,
  faPlusSquare,
  faReply,
  faRetweet,
  faSmileBeam,
  faStar,
  faThumbtack,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faEnvelope,
  faGlobe,
  faIgloo,
  faLock,
  faLockOpen,
  faTimes,
  faRetweet,
  faReply,
  faPlusSquare,
  faStar,
  faSmileBeam,
  faEllipsisH,
  faEyeSlash,
  faEye,
  faThumbtack,
  faChevronUp,
  faChevronDown,
  faAngleDoubleRight,
  faPlay,
)

const Status = {
  name: 'Status',
  components: {
    PostStatusForm,
    UserAvatar,
    AvatarList,
    Timeago,
    StatusPopover,
    UserListPopover,
    EmojiReactions,
    StatusContent,
    MentionLink,
    MentionsLine,
    UserPopover,
    UserLink,
    Quote: defineAsyncComponent(() => import('src/components/quote/quote.vue')),
    StatusActionButtons,
  },
  props: {
    statusoid: Object,
    replies: Array,

    expandable: Boolean,
    focused: Boolean,
    compact: Boolean,
    isPreview: Boolean,
    noHeading: Boolean,
    inlineExpanded: Boolean,
    showPinned: Boolean,
    inProfile: Boolean,
    inConversation: Boolean,
    inQuote: Boolean,

    profileUserId: String,
    simpleTree: Boolean,
    showOtherRepliesAsButton: Boolean,
    canDive: Boolean,
    ignoreMute: Boolean,

    threadDisplayStatus: String,
  },
  emits: ['goto', 'dive', 'toggleExpanded', 'suspendableStateChange'],
  data() {
    return {
      replying: false,
      unmuted: false,
      userExpanded: false,
      mediaPlaying: new Set(),
      error: null,
      headTailLinks: null,
    }
  },
  computed: {
    showReasonMutedThread() {
      return (
        (this.status.thread_muted ||
          (this.status.reblog && this.status.reblog.thread_muted)) &&
        !this.inConversation
      )
    },
    allowNonSquareEmoji() {
      return this.mergedConfig.nonSquareEmoji
    },
    pauseMfm() {
      return this.mergedConfig.pauseMfm
    },
    scaleMfm() {
      return this.mergedConfig.scaleMfm
    },
    repeaterClass() {
      const user = this.statusoid.user
      return highlightClass(user)
    },
    userClass() {
      const user = this.retweet
        ? this.statusoid.retweeted_status.user
        : this.statusoid.user
      return highlightClass(user)
    },
    deleted() {
      return this.statusoid.deleted
    },
    repeaterStyle() {
      const user = this.statusoid.user
      return highlightStyle(useUserHighlightStore().get(user.screen_name))
    },
    userStyle() {
      if (this.noHeading) return
      const user = this.retweet
        ? this.statusoid.retweeted_status.user
        : this.statusoid.user
      return highlightStyle(useUserHighlightStore().get(user.screen_name))
    },
    userProfileLink() {
      return this.generateUserProfileLink(
        this.status.user.id,
        this.status.user.screen_name,
      )
    },
    replyProfileLink() {
      if (this.isReply) {
        const user = this.$store.getters.findUser(
          this.status.in_reply_to_user_id,
        )
        // FIXME Why user not found sometimes???
        return user ? user.statusnet_profile_url : 'NOT_FOUND'
      }
    },
    retweet() {
      return !!this.statusoid.retweeted_status
    },
    retweeterUser() {
      return this.statusoid.user
    },
    retweeter() {
      return this.statusoid.user.name || this.statusoid.user.screen_name_ui
    },
    retweeterHtml() {
      return this.statusoid.user.name
    },
    retweeterProfileLink() {
      return this.generateUserProfileLink(
        this.statusoid.user.id,
        this.statusoid.user.screen_name,
      )
    },
    status() {
      if (this.retweet) {
        return this.statusoid.retweeted_status
      } else {
        return this.statusoid
      }
    },
    statusFromGlobalRepository() {
      // NOTE: Consider to replace status with statusFromGlobalRepository
      return this.$store.state.statuses.allStatusesObject[this.status.id]
    },
    loggedIn() {
      return !!this.currentUser
    },
    muteFilterHits() {
      return muteFilterHits(
        Object.values(
          useSyncConfigStore().prefsStorage.simple.muteFilters || {},
        ),
        this.status,
      )
    },
    botStatus() {
      return this.status.user.actor_type === 'Service'
    },
    showActorTypeIndicator() {
      return !this.hideBotIndication
    },
    sensitiveStatus() {
      return this.status.nsfw
    },
    mentionsLine() {
      if (!this.headTailLinks) return []
      const writtenSet = new Set(
        this.headTailLinks.writtenMentions.map((_) => _.url),
      )
      return this.status.attentions
        .filter((attn) => {
          // no reply user
          return (
            attn.id !== this.status.in_reply_to_user_id &&
            // no self-replies
            attn.statusnet_profile_url !==
              this.status.user.statusnet_profile_url &&
            // don't include if mentions is written
            !writtenSet.has(attn.statusnet_profile_url)
          )
        })
        .map((attn) => ({
          url: attn.statusnet_profile_url,
          content: attn.screen_name,
          userId: attn.id,
        }))
    },
    hasMentionsLine() {
      return this.mentionsLine.length > 0
    },
    muteReasons() {
      return [
        this.userIsMuted ? 'user' : null,
        this.status.thread_muted ? 'thread' : null,
        this.muteFilterHits.length > 0 ? 'filtered' : null,
        this.muteBotStatuses && this.botStatus ? 'bot' : null,
        this.muteSensitiveStatuses && this.sensitiveStatus ? 'nsfw' : null,
      ].filter((_) => _)
    },
    muteLocalized() {
      if (this.muteReasons.length === 0) return null
      const mainReason = () => {
        switch (this.muteReasons[0]) {
          case 'user':
            return this.$t('status.muted_user')
          case 'thread':
            return this.$t('status.thread_muted')
          case 'filtered':
            return this.$t(
              'status.muted_filters',
              {
                name: this.muteFilterHits[0].name,
                filterMore: this.muteFilterHits.length - 1,
              },
              this.muteFilterHits.length,
            )
          case 'bot':
            return this.$t('status.bot_muted')
          case 'nsfw':
            return this.$t('status.sensitive_muted')
        }
      }
      if (this.muteReasons.length > 1) {
        return this.$t(
          'status.multi_reason_mute',
          {
            main: mainReason(),
            numReasonsMore: this.muteReasons.length - 1,
          },
          this.muteReasons.length - 1,
        )
      } else {
        return mainReason()
      }
    },
    muted() {
      if (this.ignoreMute) return false
      if (this.statusoid.user.id === this.currentUser.id) return false
      return !this.unmuted && !this.shouldNotMute && this.muteReasons.length > 0
    },
    userIsMuted() {
      if (this.statusoid.user.id === this.currentUser.id) return false
      const { status } = this
      const { reblog } = status
      const relationship = this.$store.getters.relationship(status.user.id)
      const relationshipReblog =
        reblog && this.$store.getters.relationship(reblog.user.id)
      return (
        (status.muted && !status.thread_muted) ||
        // Reprööt of a muted post according to BE
        (reblog?.muted && !reblog.thread_muted) ||
        // Muted user
        relationship.muting ||
        // Muted user of a reprööt
        (relationshipReblog?.muting)
      )
    },
    shouldNotMute() {
      if (this.ignoreMute) return true
      if (this.focused) return true
      const { status } = this
      const { reblog } = status
      return (
        ((this.inProfile &&
          // Don't mute user's posts on user timeline (except reblogs)
          ((!reblog && status.user.id === this.profileUserId) ||
            // Same as above but also allow self-reblogs
            (reblog?.user.id === this.profileUserId))) ||
          // Don't mute statuses in muted conversation when said conversation is opened
          (this.inConversation && status.thread_muted)) &&
        // No excuses if post has muted words
        !this.muteFilterHits.length > 0
      )
    },
    hideMutedUsers() {
      return this.mergedConfig.hideMutedPosts
    },
    hideMutedThreads() {
      return this.mergedConfig.hideMutedThreads
    },
    hideFilteredStatuses() {
      return this.mergedConfig.hideFilteredStatuses
    },
    hideWordFilteredPosts() {
      return this.mergedConfig.hideWordFilteredPosts
    },
    hideStatus() {
      return (
        !this.shouldNotMute &&
        ((this.muted && this.hideFilteredStatuses) ||
          (this.userIsMuted && this.hideMutedUsers) ||
          (this.status.thread_muted && this.hideMutedThreads) ||
          (this.muteFilterHits.length > 0 && this.hideWordFilteredPosts) ||
          this.muteFilterHits.some((x) => x.hide))
      )
    },
    isReply() {
      return !!(
        this.status.in_reply_to_status_id && this.status.in_reply_to_user_id
      )
    },
    replyToName() {
      if (this.status.in_reply_to_screen_name) {
        return this.status.in_reply_to_screen_name
      } else {
        const user = this.$store.getters.findUser(
          this.status.in_reply_to_user_id,
        )
        return user?.screen_name_ui
      }
    },
    combinedFavsAndRepeatsUsers() {
      // Use the status from the global status repository since favs and repeats are saved in it
      const combinedUsers = [].concat(
        this.statusFromGlobalRepository.favoritedBy,
        this.statusFromGlobalRepository.rebloggedBy,
      )
      return uniqBy(combinedUsers, 'id')
    },
    tags() {
      return this.status.tags
        .filter((tagObj) => Object.hasOwn(tagObj, 'name'))
        .map((tagObj) => tagObj.name)
        .join(' ')
    },
    hidePostStats() {
      return this.mergedConfig.hidePostStats
    },
    shouldDisplayFavsAndRepeats() {
      return (
        !this.hidePostStats &&
        this.focused &&
        (this.combinedFavsAndRepeatsUsers.length > 0 ||
          this.statusFromGlobalRepository.quotes_count)
      )
    },
    muteBotStatuses() {
      return this.mergedConfig.muteBotStatuses
    },
    muteSensitiveStatuses() {
      return this.mergedConfig.muteSensitiveStatuses
    },
    hideBotIndication() {
      return this.mergedConfig.hideBotIndication
    },
    currentUser() {
      return this.$store.state.users.currentUser
    },
    mergedConfig() {
      return useMergedConfigStore().mergedConfig
    },
    isSuspendable() {
      return !this.replying && this.mediaPlaying.size === 0
    },
    inThreadForest() {
      return !!this.threadDisplayStatus
    },
    threadShowing() {
      return this.threadDisplayStatus === 'showing'
    },
    visibilityLocalized() {
      return this.$i18n.t('general.scope_in_timeline.' + this.status.visibility)
    },
    isEdited() {
      return this.status.edited_at !== null
    },
    editingAvailable() {
      return useInstanceCapabilitiesStore().editingAvailable
    },
    quoteId() {
      return this.status.quote_id
    },
    quoteUrl() {
      return this.status.quote_url
    },
    quoteVisible() {
      return this.status.quote_visible
    },
    quoteExpanded() {
      return !this.inQuote
    },
    scrobblePresent() {
      if (this.mergedConfig.hideScrobbles) return false
      if (!this.status.user?.latestScrobble) return false
      const value = this.mergedConfig.hideScrobblesAfter.match(/\d+/gs)[0]
      const unit = this.mergedConfig.hideScrobblesAfter.match(/\D+/gs)[0]
      let multiplier = 60 * 1000 // minutes is smallest unit
      switch (unit) {
        case 'm':
          break
        case 'h':
          multiplier *= 60 // hour
          break
        case 'd':
          multiplier *= 60 // hour
          multiplier *= 24 // day
          break
      }
      const maxAge = Number(value) * multiplier
      const createdAt = Date.parse(this.status.user.latestScrobble.created_at)
      const age = Date.now() - createdAt
      if (age > maxAge) return false
      return this.status.user.latestScrobble.artist
    },
    scrobble() {
      return this.status.user?.latestScrobble
    },
  },
  methods: {
    visibilityIcon(visibility) {
      switch (visibility) {
        case 'private':
          return 'lock'
        case 'unlisted':
          return 'lock-open'
        case 'direct':
          return 'envelope'
        case 'local':
          return 'igloo'
        default:
          return 'globe'
      }
    },
    showError(error) {
      this.error = error
    },
    clearError() {
      this.error = undefined
    },
    toggleReplyForm() {
      if (this.replying) {
        // This emits 'close-accepted' if successful
        // which in turn callse closeReply()
        this.$refs.postStatusForm.requestClose()
      } else {
        this.replying = true
      }
    },
    closeReplyForm() {
      this.replying = false
    },
    gotoOriginal(id) {
      if (this.inConversation) {
        this.$emit('goto', id)
      }
    },
    toggleExpanded() {
      this.$emit('toggleExpanded')
    },
    toggleMute() {
      this.unmuted = !this.unmuted
    },
    toggleUserExpanded() {
      this.userExpanded = !this.userExpanded
    },
    generateUserProfileLink(id, name) {
      return generateProfileLink(
        id,
        name,
        useInstanceStore().restrictedNicknames,
      )
    },
    addMediaPlaying(id) {
      this.mediaPlaying.add(id)
    },
    removeMediaPlaying(id) {
      this.mediaPlaying.delete(id)
    },
    setHeadTailLinks(headTailLinks) {
      this.headTailLinks = headTailLinks
    },
    toggleThreadDisplay() {
      this.controlledToggleThreadDisplay()
    },
    scrollIfFocused(focused) {
      if (this.$el.getBoundingClientRect == null) return
      if (focused) {
        const rect = this.$el.getBoundingClientRect()
        if (rect.top < 100) {
          // Post is above screen, match its top to screen top
          window.scrollBy(0, rect.top - 100)
        } else if (rect.height >= window.innerHeight - 50) {
          // Post we want to see is taller than screen so match its top to screen top
          window.scrollBy(0, rect.top - 100)
        } else if (rect.bottom > window.innerHeight - 50) {
          // Post is below screen, match its bottom to screen bottom
          window.scrollBy(0, rect.bottom - window.innerHeight + 50)
        }
      }
    },
  },
  watch: {
    focused: function (id) {
      this.scrollIfFocused(id)
    },
    'status.repeat_num': function (num) {
      // refetch repeats when repeat_num is changed in any way
      if (
        this.focused &&
        this.statusFromGlobalRepository.rebloggedBy &&
        this.statusFromGlobalRepository.rebloggedBy.length !== num
      ) {
        this.$store.dispatch('fetchRepeats', this.status.id)
      }
    },
    'status.fave_num': function (num) {
      // refetch favs when fave_num is changed in any way
      if (
        this.focused &&
        this.statusFromGlobalRepository.favoritedBy &&
        this.statusFromGlobalRepository.favoritedBy.length !== num
      ) {
        this.$store.dispatch('fetchFavs', this.status.id)
      }
    },
    isSuspendable: function (suspend) {
      this.$emit('suspendableStateChange', { id: this.statusoid.id, suspend })
    },
  },
}

export default Status
