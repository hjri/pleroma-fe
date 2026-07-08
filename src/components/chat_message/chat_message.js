import { mapState as mapPiniaState } from 'pinia'
import { mapState } from 'vuex'

import Attachment from 'src/components/attachment/attachment.vue'
import ChatMessageDate from 'src/components/chat_message_date/chat_message_date.vue'
import Gallery from 'src/components/gallery/gallery.vue'
import LinkPreview from 'src/components/link-preview/link-preview.vue'
import Popover from 'src/components/popover/popover.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisH, faTimes, faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faEllipsisH, faCircleNotch)

const ChatMessage = {
  name: 'ChatMessage',
  props: ['edited', 'noHeading', 'chatItem', 'hoveredMessageChain'],
  emits: ['hover'],
  components: {
    Popover,
    Attachment,
    StatusContent,
    UserAvatar,
    Gallery,
    LinkPreview,
    ChatMessageDate,
    UserPopover,
  },
  computed: {
    // Returns HH:MM (hours and minutes) in local time.
    createdAt() {
      const time = this.chatItem.data.created_at
      return time.toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    },
    isStatus() {
      // ChatMessage only has account_id while Status has full user data
      return !!this.message.user
    },
    author() {
      const accountId = this.message.account_id || this.message.user.id

      return this.$store.getters.findUser(accountId)
    },
    isCurrentUser() {
      return this.author.id === this.currentUser.id
    },
    message() {
      return this.isMessage ? this.chatItem.data : null
    },
    isMessage() {
      return this.chatItem.type === 'message'
    },
    messageForStatusContent() {
      return {
        summary: '',
        emojis: this.message.emojis,
        raw_html: this.message.content || this.message.raw_html || '',
        text: this.message.content || '',
        attachments: this.message.attachments,
      }
    },
    hasAttachment() {
      return this.message.attachments.length > 0
    },
    ...mapPiniaState(useInterfaceStore, {
      betterShadow: (store) => store.browserSupport.cssFilter,
    }),
    ...mapState({
      currentUser: (state) => state.users.currentUser,
      restrictedNicknames: (state) => useInstanceStore().restrictedNicknames,
    }),
    popoverMarginStyle() {
      if (this.isCurrentUser) {
        return {}
      } else {
        return { left: 50 }
      }
    },
    ...mapPiniaState(useMergedConfigStore, ['mergedConfig', 'findUser']),
  },
  data() {
    return {
      hovered: false,
      menuOpened: false,
    }
  },
  methods: {
    onHover(bool) {
      this.$emit('hover', {
        isHovered: bool,
        messageChainId: this.chatItem.messageChainId,
      })
    },
    async deleteMessage() {
      const confirmed = window.confirm(this.$t('chats.delete_confirm'))
      if (confirmed) {
        await this.$emit('delete', {
          messageId: this.chatItem.data.id,
          chatId: this.chatItem.data.chat_id,
        })
      }
      this.hovered = false
      this.menuOpened = false
    },
  },
}

export default ChatMessage
