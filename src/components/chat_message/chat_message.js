import { mapState as mapPiniaState } from 'pinia'
import { mapGetters, mapState } from 'vuex'
import { defineAsyncComponent } from 'vue'

import Attachment from 'src/components/attachment/attachment.vue'
import ChatMessageDate from 'src/components/chat_message_date/chat_message_date.vue'
import LinkPreview from 'src/components/link-preview/link-preview.vue'
import Popover from 'src/components/popover/popover.vue'
import StatusContent from 'src/components/status_content/status_content.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'
import UserPopover from 'src/components/user_popover/user_popover.vue'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEllipsisH, faTimes } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faEllipsisH)

const ChatMessage = {
  name: 'ChatMessage',
  props: [
    'author',
    'edited',
    'noHeading',
    'chatViewItem',
    'hoveredMessageChain',
  ],
  emits: ['hover'],
  components: {
    Popover,
    Attachment,
    StatusContent,
    UserAvatar,
    Gallery: defineAsyncComponent(
      () => import( 'src/components/gallery/gallery.vue'),
    ),
    LinkPreview,
    ChatMessageDate,
    UserPopover,
  },
  computed: {
    // Returns HH:MM (hours and minutes) in local time.
    createdAt() {
      const time = this.chatViewItem.data.created_at
      return time.toLocaleTimeString('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    },
    isCurrentUser() {
      return this.message.account_id === this.currentUser.id
    },
    message() {
      return this.chatViewItem.data
    },
    isMessage() {
      return this.chatViewItem.type === 'message'
    },
    messageForStatusContent() {
      return {
        summary: '',
        emojis: this.message.emojis,
        raw_html: this.message.content || '',
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
        messageChainId: this.chatViewItem.messageChainId,
      })
    },
    async deleteMessage() {
      const confirmed = window.confirm(this.$t('chats.delete_confirm'))
      if (confirmed) {
        await this.$store.dispatch('deleteChatMessage', {
          messageId: this.chatViewItem.data.id,
          chatId: this.chatViewItem.data.chat_id,
        })
      }
      this.hovered = false
      this.menuOpened = false
    },
  },
}

export default ChatMessage
