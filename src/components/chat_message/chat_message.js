import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Attachment from 'src/components/attachment/attachment.vue'
import ChatMessageDate from 'src/components/chat_message_date/chat_message_date.vue'
import EmojiReactions from 'src/components/emoji_reactions/emoji_reactions.vue'
import Gallery from 'src/components/gallery/gallery.vue'
import LinkPreview from 'src/components/link-preview/link-preview.vue'
import MentionLink from 'src/components/mention_link/mention_link.vue'
import Popover from 'src/components/popover/popover.vue'
import StatusActionButtons from 'src/components/status_action_buttons/status_action_buttons.vue'
import StatusBody from 'src/components/status_body/status_body.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import StatusPopover from 'src/components/status_popover/status_popover.vue'
import Timeago from 'src/components/timeago/timeago.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleNotch,
  faEllipsisH,
  faReply,
  faRetweet,
  faStar,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faEllipsisH, faCircleNotch, faReply, faStar, faRetweet)

const ChatMessage = {
  name: 'ChatMessage',
  props: [
    'edited',
    'noHeading',
    'chatItem',
    'hoveredMessageChain',
    'focused',
    'repliedTo',
  ],
  emits: ['hover', 'replyRequested', 'heightChange', 'suspendableStateChange'],
  data() {
    return {
      resizeObserver: new ResizeObserver(this.updateVirtualHeight),
      mediaPlaying: new Set(),
      hovered: false,
      menuOpened: false,
    }
  },
  components: {
    Popover,
    Attachment,
    StatusContent,
    StatusBody,
    StatusActionButtons,
    UserAvatar,
    Gallery,
    LinkPreview,
    ChatMessageDate,
    EmojiReactions,
    UserPopover,
    StatusPopover,
    MentionLink,
    Quote: defineAsyncComponent(() => import('src/components/quote/quote.vue')),
    Timeago,
  },
  inject: ['deleteChatMessage'],
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
  computed: {
    isMessage() {
      return this.chatItem.type === 'message'
    },
    message() {
      if (!this.isMessage) return null
      return this.chatItem.data.retweeted_status ?? this.chatItem.data
    },
    previousItem() {
      return this.chatItem.olderMessage
    },
    isStatus() {
      // ChatMessage only has account_id while Status has full user data
      return !!this.message.user
    },
    authorId() {
      return this.isStatus ? this.message.user.id : this.message.account_id
    },
    author() {
      return useUsersStore().findUser(this.authorId)
    },
    isCurrentUser() {
      // mini-hack/optimizaiton:
      // - current user would always be in memory so if user is missing it's obviously not us
      // - if anon views page then "us" pretty much doesn't exist
      if (!this.author || !this.currentUser) return false
      return this.author.id === this.currentUser.id
    },

    // Reply stuff
    isCustomReply() {
      if (!this.previousItem) return false
      if (!this.message.in_reply_to_status_id) return false
      return this.previousItem.id !== this.message.in_reply_to_status_id
    },
    isBrokenReply() {
      if (!this.previousItem) return false
      return !this.message.in_reply_to_status_id
    },
    customReplyTo() {
      return useStatusesStore().allStatuses.get(
        this.message.in_reply_to_status_id,
      )
    },
    replyToName() {
      if (this.message.in_reply_to_screen_name) {
        return this.message.in_reply_to_screen_name
      } else {
        const user = useUsersStore().findUser(this.message.in_reply_to_user_id)
        return user?.screen_name_ui
      }
    },
    replyProfileLink() {
      if (this.isCustomReply) {
        const user = useUsersStore().findUser(this.message.in_reply_to_user_id)
        return user.statusnet_profile_url
      }
    },

    // Quote stuff
    quoteId() {
      return this.message.quote_id
    },
    quoteUrl() {
      return this.message.quote_url
    },
    quoteVisible() {
      return this.message.quote_visible
    },

    // Content
    messageForStatusContent() {
      return {
        ...this.message,
        summary: '',
        emojis: this.message.emojis,
        raw_html: this.message.content || this.message.raw_html || '',
        text: this.message.content || '',
      }
    },
    hasAttachment() {
      return this.message.attachments.length > 0
    },

    // Stylistic
    classnames() {
      return {
        '-outgoing': this.isCurrentUser,
        '-incoming': !this.isCurrentUser,
        '-pending': this.message.pending,
        '-focused': this.focused,
      }
    },
    popoverMarginStyle() {
      if (this.isCurrentUser) {
        return {}
      } else {
        return { left: 50 }
      }
    },
    isSuspendable() {
      return this.mediaPlaying.size === 0
    },

    // Global stuff
    ...mapState(useInterfaceStore, {
      betterShadow: (store) => store.browserSupport.cssFilter,
    }),
    ...mapState(useUsersStore, ['currentUser']),
    ...mapState(useInstanceStore, ['restrictedNicknames']),
    ...mapState(useMergedConfigStore, ['mergedConfig']),
  },
  methods: {
    onHover(bool) {
      this.$emit('hover', {
        isHovered: bool,
        messageChainId: this.chatItem.messageChainId,
      })
    },
    updateVirtualHeight(e) {
      const [entry] = e
      this.$emit('heightChange', {
        id: this.chatItem.id,
        height: entry.contentRect.height + 1,
        element: this.$el,
      })
    },
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
    visibilityLocalized() {
      return this.$i18n.t('general.scope_in_timeline.' + this.status.visibility)
    },
    async deleteMessage() {
      const confirmed = window.confirm(this.$t('chats.delete_confirm'))
      if (confirmed) {
        await this.deleteChatMessage({
          messageId: this.message.id,
          chatId: this.message.chat_id,
        })
      }
      this.hovered = false
      this.menuOpened = false
    },
    addMediaPlaying(id) {
      this.mediaPlaying.add(id)
    },
    removeMediaPlaying(id) {
      this.mediaPlaying.delete(id)
    },
  },
  watch: {
    isSuspendable: function (suspendable) {
      this.$emit('suspendableStateChange', { id: this.chatItem.id, suspendable })
    },
  },
}

export default ChatMessage
