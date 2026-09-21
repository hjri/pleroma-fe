import { orderBy, uniqueId } from 'lodash-es'

import ChatMessage from 'src/components/chat_message/chat_message.vue'

const ChatMessageList = {
  components: {
    ChatMessage,
  },
  props: {
    messages: Array,
    pendingMessages: {
      type: Array,
      required: false,
      default: [],
    },
    headerDate: Boolean,
    focusedId: String,
    repliedId: String,
  },
  data() {
    return {
      hoveredMessageChainId: undefined,
    }
  },
  emits: ['messageDelete', 'replyRequested'],
  computed: {
    chatItems() {
      const messages = [
        ...orderBy(this.messages, ['pending', 'id'], ['asc', 'asc']),
        ...this.pendingMessages.map((m) => ({ ...m, pending: true })),
      ]
      return messages
        .reduceRight((acc, message, index) => {
          const date = new Date(message.created_at)

          const olderMessage = messages[index - 1]
          const newerItem = acc[acc.length - 1]

          const diff = olderMessage
            ? message.created_at - olderMessage.created_at
            : null

          const MAX_DIFF = 1000 * 60 * 5 // 5 minutes

          const dateDiffs = (() => {
            if (olderMessage) {
              const newerDate = new Date(message.created_at)
              const olderDate = new Date(olderMessage.created_at)

              newerDate.setHours(0, 0, 0, 0)
              olderDate.setHours(0, 0, 0, 0)

              return newerDate.toISOString() !== olderDate.toISOString()
            } else {
              return true
            }
          })()

          const chatItem = {
            type: 'message',
            data: message,
            date,
            id: message.id,
            isTail: true,
            isHead: true,
          }

          if (newerItem == null) {
            chatItem.messageChainId = uniqueId()
          } else if (newerItem.type === 'date') {
            chatItem.messageChainId = uniqueId()
          } else if (newerItem.type === 'message') {
            const newerUser =
              newerItem.data.account_id || newerItem.data.user.id
            const olderUser = message.account_id || message.user.id
            if (newerUser !== olderUser) {
              chatItem.messageChainId = uniqueId()
            } else {
              chatItem.messageChainId = newerItem.messageChainId
              chatItem.isTail = false
              newerItem.isHead = false
            }
          }

          if (diff > MAX_DIFF || (!olderMessage && this.headerDate)) {
            return [
              ...acc,
              chatItem,
              {
                type: 'date',
                date,
                isDate: dateDiffs,
                isTime: diff > MAX_DIFF && !dateDiffs,
                id: date.getTime().toString(),
              },
            ]
          } else {
            return [...acc, chatItem]
          }
        }, [])
        .reverse()
    },
  },
  methods: {
    onMessageHover({ isHovered, messageChainId }) {
      this.hoveredMessageChainId = isHovered ? messageChainId : undefined
    },
    onMessageDelete({ messageId, chatId }) {
      this.$emit('messageDelete', { messageId, chatId })
    },
    onReplyRequested(message) {
      this.$emit('replyRequested', message)
    },
    getPreviousItem(index) {
      let result = null

      this.chatItems
        .slice(0, index)
        .reverse()
        .some((item) => {
          const isMessage = item.type === 'message'
          if (isMessage) {
            result = item
          }
          return isMessage
        })

      return result
    },
  },
}

export default ChatMessageList
