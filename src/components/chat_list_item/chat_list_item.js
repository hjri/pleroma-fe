import { mapState } from 'pinia'

import AvatarList from 'src/components/avatar_list/avatar_list.vue'
import ChatTitle from 'src/components/chat_title/chat_title.vue'
import StatusBody from 'src/components/status_content/status_content.vue'
import Timeago from 'src/components/timeago/timeago.vue'
import UserAvatar from 'src/components/user_avatar/user_avatar.vue'

import { useUsersStore } from 'src/stores/users.js'

const ChatListItem = {
  name: 'ChatListItem',
  props: ['chat'],
  components: {
    UserAvatar,
    AvatarList,
    Timeago,
    ChatTitle,
    StatusBody,
  },
  computed: {
    ...mapState(useUsersStore, ['currentUser']),
    attachmentInfo() {
      if (this.chat.lastMessage.attachments.length === 0) {
        return
      }

      const types = new Set(this.chat.lastMessage.attachments.map((file) => file.type))
      if (types.has('video')) {
        return this.$t('file_type.video')
      } else if (types.has('audio')) {
        return this.$t('file_type.audio')
      } else if (types.has('image')) {
        return this.$t('file_type.image')
      } else {
        return this.$t('file_type.file')
      }
    },
    messageForStatusContent() {
      const message = this.chat.lastMessage
      const messageEmojis = message ? message.emojis : []
      const isYou = message?.account_id === this.currentUser.id
      const content = message ? this.attachmentInfo || message.content : ''
      const messagePreview = isYou
        ? `<i>${this.$t('chats.you')}</i> ${content}`
        : content
      return {
        summary: '',
        emojis: messageEmojis,
        raw_html: messagePreview,
        text: messagePreview,
        attachments: [],
      }
    },
  },
  methods: {
    openChat() {
      if (this.chat.id) {
        this.$router.push({
          name: 'chat',
          params: {
            username: this.currentUser.screen_name,
            chatUserId: this.chat.account.id,
          },
        })
      }
    },
  },
}

export default ChatListItem
