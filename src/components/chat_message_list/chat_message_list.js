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

        const diff = message.created_at - (olderMessage?.created_at || 0)
        const MAX_DIFF = 1000 * 60 // 5 minutes

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

        if (diff > MAX_DIFF || !olderMessage) {
          return [...acc, chatItem, {
            type: 'date',
            date,
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
