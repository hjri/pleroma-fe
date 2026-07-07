import { throttle, orderBy, uniqueId } from 'lodash'
import { mapState as mapPiniaState } from 'pinia'
import { mapGetters, mapState } from 'vuex'

import ChatMessage from 'src/components/chat_message/chat_message.vue'

const ChatMessageList = {
  components: {
    ChatMessage,
  },
  props: {
    messages: Array,
    headerDate: Boolean,
  },
  data() {
    return {
      hoveredMessageChainId: undefined,
    }
  },
  computed: {
    chatItems() {
      const messages = orderBy(this.messages, ['pending', 'id'], ['asc', 'asc'])
      return messages.reduceRight((acc, message, index) => {
        const date = new Date(message.created_at)

        const olderMessage = messages[index - 1]
        const newerMessage = messages[index + 1]
        const newerItem = acc[acc.length - 1]

        const diff = olderMessage ? message.created_at - olderMessage.created_at : null

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
        } else {
          if (newerItem.type === 'date') {
            chatItem.messageChainId = uniqueId()
          } else if (newerItem.type === 'message') {
            if (newerItem.data.account_id !== message.account_id) {
              chatItem.messageChainId = uniqueId()
            } else {
              chatItem.messageChainId = newerItem.messageChainId
              chatItem.isTail = false
              newerItem.isHead = false
            }
          }
        }

        if (diff > MAX_DIFF || (!olderMessage && this.headerDate)) {
          return [...acc, chatItem, {
            type: 'date',
            date,
            isDate: dateDiffs,
            isTime: diff > MAX_DIFF && !dateDiffs,
            id: date.getTime().toString(),
          }]
        } else {
          return [...acc, chatItem]
        }
      }, []).reverse()
    }
  },
  methods: {
    onMessageHover({ isHovered, messageChainId }) {
      this.hoveredMessageChainId = isHovered ? messageChainId : undefined
    },
  }
}

export default ChatMessageList
