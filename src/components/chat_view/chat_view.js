import { storeToRefs } from 'pinia'
import {
  computed,
  inject,
  nextTick,
  provide,
  ref,
  toRefs,
  useTemplateRef,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import ChatTitle from 'src/components/chat_title/chat_title.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'

import { useInterfaceStore } from 'src/stores/interface.js'

import { useClientRectSize } from 'src/composables/useClientRectSize.js'
import { useConversation } from 'src/composables/useConversation.js'
import { useDocumentFocus } from 'src/composables/useDocumentFocus.js'
import { usePleromaChat } from 'src/composables/usePleromaChat.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown, faChevronLeft } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown, faChevronLeft)

const MARK_AS_READ_DELAY = 1500

const Chat = {
  components: {
    ChatMessageList,
    ChatTitle,
    PostStatusForm,
  },
  props: {
    statusId: {
      type: String,
      default: null,
    },
    chatUserId: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const { statusId, chatUserId } = toRefs(props)

    const isConversation = computed(() => !!statusId.value)
    const isChat = computed(() => !!chatUserId.value)
    const isValid = computed(() => !!isChat.value !== !!isConversation.value) // Logical XOR
    watch(isValid, (value) => {
      if (!value)
        throw TypeError(
          'Chat view must have either statusId or chatUserId, but not both',
        )
    })

    // # Conversation stuff
    const {
      conversation: conversationMessages,
      loadError: conversationError,

      focusedId,
      setFocused,
      fetchConversation,
    } = useConversation(statusId, true)
    watch(isConversation, (value) => {
      if (!value) return
      fetchConversation()
    })

    // # Chat stuff
    const {
      activate: chatActivate,
      deactivate: chatDeactivate,
      markAsRead: chatMarkRead,
      fetchOlder: chatFetchOlder,
      messages: chatMessages,
      pendingMessages: chatPendingMessages,
      newMessagesCount: chatNewMessagesCount,
      fetchError: chatError,

      sendMessage,
      deleteChatMessage,
    } = usePleromaChat(chatUserId)
    provide('deleteChatMessage', deleteChatMessage)
    watch(chatUserId, (neu, old) => {
      if (old) {
        chatDeactivate()
      }
      if (neu) {
        chatActivate()
      }
    })

    // # Forks
    const messages = computed(() => {
      if (isConversation.value) {
        return conversationMessages.value
      } else {
        return chatMessages.value
      }
    })
    const pendingMessages = computed(() => {
      if (isConversation.value) {
        return [] // Not implemented yet
      } else {
        return chatPendingMessages.value
      }
    })
    const newMessagesCount = computed(() => {
      if (isConversation.value) {
        return 0 // Not implemented yet
      } else {
        return chatNewMessagesCount.value
      }
    })
    const error = computed(() => {
      if (isConversation.value) {
        return conversationError.value
      } else {
        return chatError.value
      }
    })

    const fetchOlder = () => {
      if (isChat.value) {
        chatFetchOlder()
      }
      // Unsupported in conversations
    }
    const markAsRead = () => {
      if (isChat.value) {
        chatMarkRead()
      }
      // Unsupported in conversations
    }

    // Reply-to
    const explicitReply = ref(null)
    const lastMessage = computed(() => messages.value?.at(-1))
    const replyTo = computed(() => explicitReply.value ?? lastMessage.value)

    const scroller = inject('bodyScrollPosition')
    const rootElement = useTemplateRef('root')
    const postForm = useTemplateRef('postform')

    // Post form stuff
    watch(replyTo, () => {
      if (isConversation.value) postForm.update()
    })

    // # Scroll stuff
    const { hasReachedBottom, cHeight, scrollTo } = scroller

    // ## Bottom-sticking stuff
    const stickToBottom = async (forceRead) => {
      // We don't want to scroll to the bottom on a new message when the user is viewing older messages.
      // Therefore we need to know whether the scroll position was at the bottom before the DOM update.
      if (!hasReachedBottom.value) return
      await nextTick()
      scrollTo({
        top: cHeight.value,
      })
      if (forceRead) {
        markAsRead()
      }
    }

    const postFormElement = computed(() => postForm.value?.$el)
    const { focused } = useDocumentFocus()
    const { height: postFormHeight } = useClientRectSize(postFormElement)
    const { vHeight: viewportHeight } = scroller
    watch(viewportHeight, stickToBottom)
    watch(postFormHeight, stickToBottom)
    watch(focused, async (value) => {
      if (!value) return
      stickToBottom(true)
    })
    watch(messages, (old, neu) => {
      if (old.length === neu.length) return
      stickToBottom(true)
    })

    // ## Load / Read
    const { shouldLoadTop } = scroller
    watch(shouldLoadTop, (value) => {
      if (value) fetchOlder()
    })
    watch(hasReachedBottom, (value) => {
      if (!value) return
      window.setTimeout(() => {
        if (
          newMessagesCount.value > 0 &&
          rootElement.value &&
          hasReachedBottom.value
        ) {
          markAsRead()
        }
      }, MARK_AS_READ_DELAY)
    })

    // Misc UI stuff
    const { layoutType } = storeToRefs(useInterfaceStore())
    const mobileLayout = computed(() => layoutType.value === 'mobile')
    const jumpToBottomButtonVisible = computed(() => !hasReachedBottom.value)
    const router = useRouter()
    const onPosted = (data) => {
      explicitReply.value = null

      if (isConversation.value) {
        router.push({
          name: 'conversation2',
          params: { statusId: data.id },
        })
      }
    }

    return {
      messages,
      pendingMessages,
      newMessagesCount,
      error,

      // Conversation-exclusive
      isConversation,
      setFocused,
      focusedId,

      // Chats-exclusive
      sendMessage,

      // Misc
      onPosted,
      mobileLayout,
      jumpToBottomButtonVisible,
    }
  },
}

export default Chat
