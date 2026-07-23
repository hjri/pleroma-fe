import { mapState as mapPiniaState } from 'pinia'
import { defineAsyncComponent } from 'vue'
import { mapState } from 'vuex'

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
    'previousItem',
    'chatItem',
    'previousItem',
    'hoveredMessageChain',
    'focused',
    'repliedTo',
  ],
  emits: ['hover', 'replyRequested'],
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
  computed: {
    isMessage() {
      return this.chatItem.type === 'message'
    },
    message() {
      if (!this.isMessage) return null
      return this.chatItem.data.retweeted_status ?? this.chatItem.data
    },
    isStatus() {
      // ChatMessage only has account_id while Status has full user data
      return !!this.message.user
    },
    author() {
      const accountId = this.isStatus
        ? this.message.user.id
        : this.message.account_id

      return this.$store.getters.findUser(accountId)
    },
    isCurrentUser() {
      return this.author.id === this.currentUser.id
    },

    // Reply stuff
    isCustomReply() {
      if (!this.previousItem) return false
      if (!this.message.in_reply_to_status_id) return false
      return this.previousItem.data.id !== this.message.in_reply_to_status_id
    },
    isBrokenReply() {
      if (!this.previousItem) return false
      return !this.message.in_reply_to_status_id
    },
    customReplyTo() {
      return this.$store.state.statuses.allStatusesObject[
        this.message.in_reply_to_status_id
      ]
    },
    replyToName() {
      if (this.message.in_reply_to_screen_name) {
        return this.message.in_reply_to_screen_name
      } else {
        const user = this.$store.getters.findUser(
          this.status.in_reply_to_user_id,
        )
        return user && user.screen_name_ui
      }
    },
    replyProfileLink() {
      if (this.isCustomReply) {
        const user = this.$store.getters.findUser(
          this.message.in_reply_to_user_id,
        )
        // FIXME Why user not found sometimes???
        return user ? user.statusnet_profile_url : 'NOT_FOUND'
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

    // Global stuff
    ...mapPiniaState(useInterfaceStore, {
      betterShadow: (store) => store.browserSupport.cssFilter,
    }),
    ...mapState({
      currentUser: (state) => state.users.currentUser,
      restrictedNicknames: (state) => useInstanceStore().restrictedNicknames,
    }),
    ...mapPiniaState(useMergedConfigStore, ['mergedConfig']),
  },
  data() {
    return {
      hovered: false,
      menuOpened: false,
    }
  },
  watch: {
    focused: function (value) {
      this.scrollIfFocused(value)
    },
  },
  methods: {
    onHover(bool) {
      this.$emit('hover', {
        isHovered: bool,
        messageChainId: this.chatItem.messageChainId,
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
        await this.$emit('delete', {
          messageId: this.message.id,
          chatId: this.message.chat_id,
        })
      }
      this.hovered = false
      this.menuOpened = false
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
}

export default ChatMessage
