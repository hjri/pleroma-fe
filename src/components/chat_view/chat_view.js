import { storeToRefs } from 'pinia'
import {
  computed,
  inject,
  onUnmounted,
  provide,
  ref,
  toRefs,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import ChatTitle from 'src/components/chat_title/chat_title.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'

import { useInterfaceStore } from 'src/stores/interface.js'

import { useClientRectSize } from 'src/composables/useClientRectSize.js'
import { useConversation } from 'src/composables/useConversation.js'
import { usePleromaChat } from 'src/composables/usePleromaChat.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown)

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
    } = useConversation(statusId, ref(true))
    watch(
      isConversation,
      (value) => {
        if (!value) return
        fetchConversation()
      },
      { immediate: true },
    )

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

      ready: chatReady,
      recipient: chatRecipient,
      sendMessage,
      deleteChatMessage,
    } = usePleromaChat(chatUserId)
    provide('deleteChatMessage', deleteChatMessage)
    watch(
      chatUserId,
      (neu, old) => {
        if (old) {
          chatDeactivate()
        }
        if (neu) {
          chatActivate()
        }
      },
      { immediate: true },
    )
    onUnmounted(() => {
      if (chatUserId.value) {
        chatDeactivate()
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
    const postForm = useTemplateRef('postStatusForm')

    // Post form stuff
    watch(replyTo, () => {
      if (isConversation.value) postForm.value.update()
    })

    // # Scroll stuff
    const { hasReachedBottom } = scroller

    const postFormElement = computed(() => postForm.value?.$el)
    const { height: postFormHeight } = useClientRectSize(postFormElement)
    const { scrollBy } = scroller

    // ### Post form size compensation
    watch(postFormHeight, (neu, old) => {
      scrollBy(0, neu - old)
    })

    // ## Load / Read
    const { shouldLoadTop } = scroller
    watchEffect(() => {
      if (shouldLoadTop.value && messages.value.length > 0) fetchOlder()
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
    const { t } = useI18n()
    const formPlaceholder = computed(() => {
      if (chatRecipient) {
        return t('chats.message_user', {
          nickname: chatRecipient.value?.screen_name_ui,
        })
      } else {
        return ''
      }
    })
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
      replyTo,
      explicitReply,

      // Conversation-exclusive
      isConversation,
      setFocused,
      focusedId,

      // Chats-exclusive
      isChat,
      sendMessage,
      chatReady,
      chatRecipient,

      // Misc
      onPosted,
      mobileLayout,
      jumpToBottomButtonVisible,
      formPlaceholder,
    }
  },
}

export default Chat
