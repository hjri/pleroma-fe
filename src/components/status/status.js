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
import { useScrobblesStore } from 'src/stores/scrobbles.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'
import { useUsersStore } from 'src/stores/users.js'

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
    statusId: String,
    statusoid: Object,
    replies: Set,

    focused: Boolean,
    compact: Boolean,
    isPreview: Boolean,
    noHeading: Boolean,
    inQuote: Boolean,

    ignoreMute: Boolean,

    threadDisplayState: String,
    conversationRank: {
      type: String,
      default: 'linear',
    },
  },
  emits: [
    'goto',
    'dive',
    'toggleExpanded',
    'suspendableStateChange',
    'heightChange',
  ],
  inject: {
    profileUserId: {
      default: null,
    },
    isPage: {
      default: false,
    },
    isExpanded: {
      default: false,
    },
    expandable: {
      default: false,
    },
  },
  data() {
    return {
      resizeObserver: new ResizeObserver(this.updateVirtualHeight),
      replying: false,
      unmuted: false,
      mediaPlaying: new Set(),
      error: null,
      headTailLinks: null,
    }
  },
  created() {
    useScrobblesStore().getLatestScrobble(this.status.user.id)
  },
  computed: {
    rootClasses() {
      return [
        {
          '-focused': this.focused,
          '-conversation': !this.isPage && this.isExpanded,
        },
        `-conversation-rank-${this.conversationRank}`,
      ]
    },
    // Whatever we're given to work with
    status() {
      return this.statusoid ?? useStatusesStore().allStatuses.get(this.statusId)
    },
    inConversation() {
      return this.isExpanded
    },
    inProfile() {
      return this.profileUserId != null
    },
    // Status repeated
    repeatedStatus() {
      if (this.status.retweeted_status === undefined) return undefined
      return useStatusesStore().allStatuses.get(this.status.retweeted_status.id)
    },
    // THE repeat
    repeatStatus() {
      if (this.isRepeat) {
        return this.status
      } else {
        return null
      }
    },
    mainStatus() {
      if (this.isRepeat) {
        return this.repeatedStatus
      } else {
        return this.status
      }
    },
    repeater() {
      return useUsersStore().findUser(this.status.user.id)
    },
    user() {
      return useUsersStore().findUser(this.mainStatus.user.id)
    },
    simpleTree() {
      return !this.mergedConfig.conversationTreeAdvanced
    },
    showOtherRepliesInside() {
      return this.mergedConfig.conversationOtherRepliesButton === 'inside'
    },
    showOtherRepliesBelow() {
      return this.mergedConfig.conversationOtherRepliesButton === 'below'
    },
    showReasonMutedThread() {
      return (
        (this.mainStatus.thread_muted || this.repeatStatus?.thread_muted) &&
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
      return highlightClass(this.repeater)
    },
    userClass() {
      return highlightClass(this.user)
    },
    isDeleted() {
      return this.status.deleted
    },
    repeaterStyle() {
      return highlightStyle(
        useUserHighlightStore().get(this.repeater.screen_name),
      )
    },
    favoritedBy() {
      return useStatusesStore().favs.get(this.mainStatus.id) ?? new Set()
    },
    repeatedBy() {
      return useStatusesStore().repeats.get(this.mainStatus.id) ?? new Set()
    },
    userStyle() {
      if (this.noHeading) return
      return highlightStyle(useUserHighlightStore().get(this.user.screen_name))
    },
    userProfileLink() {
      return this.generateUserProfileLink(this.user.id, this.user.screen_name)
    },
    replyProfileLink() {
      if (this.isReply) {
        const user = useUsersStore().findUser(
          this.mainStatus.in_reply_to_user_id,
        )

        // User referenced in post might not be yet present in store
        // since their data is not included in status data, just the id
        return user?.statusnet_profile_url
      }
    },
    isRepeat() {
      return !!this.repeatedStatus
    },
    repeaterName() {
      return this.status.user.name || this.status.user.screen_name_ui
    },
    repeaterHtml() {
      return this.status.user.name
    },
    repeaterProfileLink() {
      return this.generateUserProfileLink(
        this.repeater.id,
        this.repeater.screen_name,
      )
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
    sensitiveStatus() {
      return this.status.nsfw
    },
    mentionsLine() {
      if (!this.headTailLinks) return []
      const writtenSet = new Set(
        this.headTailLinks.writtenMentions.map((_) => _.url),
      )
      return this.mainStatus.attentions
        .filter((attn) => {
          // no reply user
          return (
            attn.id !== this.mainStatus.in_reply_to_user_id &&
            // no self-replies
            attn.statusnet_profile_url !==
              this.mainStatus.user.statusnet_profile_url &&
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
        this.mainStatus.thread_muted ? 'thread' : null,
        this.muteFilterHits.length > 0 ? 'filtered' : null,
        this.muteBotStatuses && this.botStatus ? 'bot' : null,
        this.muteSensitiveStatuses && this.sensitiveStatus ? 'nsfw' : null,
      ].filter(Boolean)
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
      if (this.status.user.id === this.currentUser?.id) return false
      return !this.unmuted && !this.shouldNotMute && this.muteReasons.length > 0
    },
    userIsMuted() {
      if (!this.currentUser) return false
      if (this.user === this.currentUser) return false
      if (this.repeater === this.currentUser) return false
      const relationship = useUsersStore().relationship(this.user.id)
      const relationshipRepeat = useUsersStore().relationship(this.repeater?.id)
      return (
        (this.status.muted && !this.status.thread_muted) ||
        // Reprööt of a muted post according to BE
        (this.repeatedStatus?.muted && !this.repeatedStatus.thread_muted) ||
        // Muted user
        relationship.muting ||
        // Muted user of a reprööt
        relationshipRepeat?.muting
      )
    },
    shouldNotMute() {
      if (this.ignoreMute) return true
      if (this.focused) return true
      const { reblog } = this.mainStatus
      return (
        ((this.inProfile &&
          // Don't mute user's posts on user timeline (except reblogs)
          ((!reblog && this.mainStatus.user.id === this.profileUserId) ||
            // Same as above but also allow self-reblogs
            reblog?.user.id === this.profileUserId)) ||
          // Don't mute statuses in muted conversation when said conversation is opened
          (this.inConversation && this.mainStatus.thread_muted)) &&
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
        this.mainStatus.in_reply_to_status_id &&
        this.mainStatus.in_reply_to_user_id
      )
    },
    replyToName() {
      if (this.mainStatus.in_reply_to_screen_name) {
        return this.mainStatus.in_reply_to_screen_name
      } else {
        const user = useUsersStore().findUser(
          this.mainStatus.in_reply_to_user_id,
        )
        return user?.screen_name_ui
      }
    },
    combinedFavsAndRepeatsUsers() {
      return new Set([...this.favoritedBy, ...this.repeatedBy])
    },
    tags() {
      return [...this.status.tags]
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
        (this.combinedFavsAndRepeatsUsers.size > 0 ||
          this.mainStatus.quotes_count)
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
      return useUsersStore().currentUser
    },
    mergedConfig() {
      return useMergedConfigStore().mergedConfig
    },
    isSuspendable() {
      return !this.replying && this.mediaPlaying.size === 0
    },
    inThreadForest() {
      return !!this.threadDisplayState
    },
    threadShowing() {
      return this.threadDisplayState === 'showing'
    },
    visibilityLocalized() {
      return this.$i18n.t('general.scope_in_timeline.' + this.status.visibility)
    },
    isEdited() {
      return this.mainStatus.edited_at !== null
    },
    editingAvailable() {
      return useInstanceCapabilitiesStore().editingAvailable
    },
    quoteId() {
      return this.mainStatus.quote_id
    },
    quoteUrl() {
      return this.mainStatus.quote_url
    },
    quoteVisible() {
      return this.mainStatus.quote_visible
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
      // FIXME
      this.controlledToggleThreadDisplay()
    },
    updateVirtualHeight(e) {
      const [entry] = e
      this.$emit('heightChange', {
        id: this.status.id,
        height: entry.contentRect.height + 1,
        element: this.$el,
      })
    },
  },
  mounted() {
    if (this.$refs.root) {
      this.resizeObserver.observe(this.$refs.root)
      this.updateVirtualHeight([
        {
          contentRect: this.$refs.root.getBoundingClientRect(),
        },
      ])
    }
  },
  unmounted() {
    this.resizeObserver.disconnect()
  },
  watch: {
    hideStatus: function () {
      if (this.$refs.root) {
        this.resizeObserver.observe(this.$refs.root)
      } else {
        this.resizeObserver.disconnect()
      }
    },
    'mainStatus.repeat_num': function (num) {
      // refetch repeats when repeat_num is changed in any way
      if (this.focused && this.repeatedBy.size !== num) {
        useStatusesStore().fetchRepeats(this.mainStatus.id)
      }
    },
    'mainStatus.fave_num': function (num) {
      // refetch favs when fave_num is changed in any way
      if (this.focused && this.favoritedBy.size !== num) {
        useStatusesStore().fetchFavs(this.mainStatus.id)
      }
    },
    isSuspendable: function (suspend) {
      this.$emit('suspendableStateChange', { id: this.status.id, suspend })
    },
  },
}

export default Status
