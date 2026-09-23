import { computed, inject, ref, toRefs, useTemplateRef } from 'vue'

import ChatMessage from 'src/components/chat_message/chat_message.vue'

import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'
import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'

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
  emits: ['replyRequested'],
  setup(props, { emit }) {
    const { messages, pendingMessages, headerDate } = toRefs(props)
    const hoveredMessageChainId = ref(null)
    const chatItems = computed(() => {
      const allMessages = [
        ...messages.value,
        ...pendingMessages.value.map((m) => ({ ...m, pending: true })),
      ]
      return allMessages
        .reduceRight((acc, message, index) => {
          const date = new Date(message.created_at)

          const olderMessage = allMessages[index - 1]
          const newerItem = acc.at(-1)

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
            olderMessage,
          }

          if (newerItem == null) {
            chatItem.messageChainId = message.id
          } else if (newerItem.type === 'date') {
            chatItem.messageChainId = message.id
          } else if (newerItem.type === 'message') {
            const newerUser =
              newerItem.data.account_id || newerItem.data.user.id
            const olderUser = message.account_id || message.user.id
            if (newerUser !== olderUser) {
              chatItem.messageChainId = message.id
            } else {
              chatItem.messageChainId = newerItem.messageChainId
              chatItem.isTail = false
              newerItem.isHead = false
            }
          }

          if (diff > MAX_DIFF || (!olderMessage && headerDate.value)) {
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
    })
    const chatItemsIndex = computed(() =>
      chatItems.value.reduce((map, value) => {
        map.set(value.id, value)
        return map
      }, new Map()),
    )

    const getCurrentItem = (id) => chatItemsIndex.value.get(id)

    const scroller = inject('bodyScrollPosition')
    const body = useTemplateRef('body')
    const { fontSize } = useInterfaceSizes()
    const normalStatusHeight = computed(() => fontSize.value * 5)
    const getPlaceholderHeight = (id) => normalStatusHeight

    const { heightChart, changeSuspendState, updateVirtualHeight } =
      useVirtualScrolling({
        name: 'ChatMessageList',
        enabled: ref(true),
        list: chatItems,
        body,
        scrollPositionInstance: scroller,
        scrollCompensation: true,
        getPlaceholderHeight,
        invertDirection: true,
      })

    const { focusedId, repliedId } = toRefs(props)

    const onMessageHover = ({ isHovered, messageChainId }) => {
      hoveredMessageChainId.value = isHovered ? messageChainId : undefined
    }
    const onReplyRequested = (message) => emit('replyRequested', message)

    return {
      heightChart,
      updateVirtualHeight,
      getCurrentItem,
      hoveredMessageChainId,

      focusedId,
      repliedId,

      onReplyRequested,
      onMessageHover,
    }
  },
}

export default ChatMessageList
