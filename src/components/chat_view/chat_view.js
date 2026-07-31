import { get, maxBy, minBy, sortBy, throttle } from 'lodash'
import { mapState as mapPiniaState } from 'pinia'
import { nextTick } from 'vue'
import { mapState } from 'vuex'

import ChatMessageList from 'src/components/chat_message_list/chat_message_list.vue'
import ChatTitle from 'src/components/chat_title/chat_title.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import { buildFakeMessage } from '../../services/chat_utils/chat_utils.js'
import { promiseInterval } from '../../services/promise_interval/promise_interval.js'
import {
  getNewTopPosition,
  getScrollPosition,
  isBottomedOut,
  isScrollable,
} from './chat_layout_utils.js'

import { useChatsStore } from 'src/stores/chats.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import {
  chatMessages,
  deleteChatMessage,
  getOrCreateChat,
  readChat,
  sendChatMessage,
} from 'src/api/chats.js'
import { fetchConversation, fetchStatus } from 'src/api/public.js'
import { WSConnectionStatus } from 'src/api/websocket.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronDown, faChevronLeft } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronDown, faChevronLeft)

const BOTTOMED_OUT_OFFSET = 10
const JUMP_TO_BOTTOM_BUTTON_VISIBILITY_OFFSET = 10
const SAFE_RESIZE_TIME_OFFSET = 100
const MARK_AS_READ_DELAY = 1500
const MAX_RETRIES = 10

const isConfirmation = (storage, message) => {
  if (!message.idempotency_key) return
  return storage.idempotencyKeyIndex[message.idempotency_key]
}

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
    testMode: Boolean,
  },
  data() {
    return {
      // Main info
      chat: null,
      messages: [],
      messagesIndex: {},
      pendingMessages: [],
      pendingMessagesIndex: {},
      minId: undefined,
      maxId: undefined,

      // Conversation stuff
      explicitReplyStatus: null,

      // Unread stuff
      newMessageCount: 0,
      lastReadMessageId: null,
      lastScrollPosition: {},
      jumpToBottomButtonVisible: false,

      // Internal network stuff
      fetcher: null,
      errorLoadingChat: false,
      messageRetriers: {},
      idempotencyKeyIndex: {},
    }
  },
  created() {
    if (this.testMode) return
    this.startFetching()
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('scroll', this.handleScroll)
    if (typeof document.hidden !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false,
      )
    }

    this.$nextTick(() => {
      this.handleResize()
    })
  },
  unmounted() {
    window.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.handleResize)
    if (typeof document.hidden !== 'undefined')
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange,
        false,
      )
  },
  computed: {
    conversationId() {
      const status = this.$store.state.statuses.allStatusesObject[this.statusId]
      return get(
        status,
        'retweeted_status.statusnet_conversation_id',
        get(status, 'statusnet_conversation_id'),
      )
    },
    isConversation() {
      return this.statusId !== null
    },
    recipient() {
      return this.chat?.account
    },
    formPlaceholder() {
      if (this.recipient) {
        return this.$t('chats.message_user', {
          nickname: this.recipient.screen_name_ui,
        })
      } else {
        return ''
      }
    },

    // Conversation stuff
    lastStatus() {
      return this.messages[this.messages.length - 1]
    },
    replyStatus() {
      return this.explicitReplyStatus ?? this.lastStatus
    },

    // Global Stuff
    streamingEnabled() {
      if (this.isConversation) return false // Unsupported
      return (
        this.mergedConfig.useStreamingApi &&
        this.mastoUserSocketStatus === WSConnectionStatus.JOINED
      )
    },
    ...mapPiniaState(useInterfaceStore, {
      mobileLayout: (store) => store.layoutType === 'mobile',
    }),
    ...mapPiniaState(useMergedConfigStore, ['mergedConfig']),
    ...mapState({
      mastoUserSocketStatus: (state) => state.api.mastoUserSocketStatus,
      currentUser: (state) => state.users.currentUser,
    }),
  },
  watch: {
    messages(old, neu) {
      if (old.length === neu.length) return
      // We don't want to scroll to the bottom on a new message when the user is viewing older messages.
      // Therefore we need to know whether the scroll position was at the bottom before the DOM update.
      const bottomedOutBeforeUpdate = isBottomedOut(BOTTOMED_OUT_OFFSET)
      this.$nextTick(() => {
        if (bottomedOutBeforeUpdate) {
          this.scrollDown()
        }
      })
    },
    async replyStatus(newVal) {
      await nextTick() // wait for changes to propagate to postStatusForm
      if (this.testMode) return
      this.$refs.postStatusForm.update()
    },
    $route: async function (newVal) {
      if (this.messagesIndex[newVal.params.statusId]) {
        const focused = document.getElementById(
          `chatmessage-${this.$route.params.statusId}`,
        )
        if (focused?.getBoundingClientRect == null) return
        const bottomBoundary =
          window.innerHeight - this.$refs.footer.clientHeight
        const topBoundary =
          this.$refs.header.clientHeight +
          document.getElementById('nav').clientHeight
        const margin = Number(
          window
            .getComputedStyle(this.$refs.messageList.$el)
            .gap.replace('px', ''),
        )

        const rect = focused.getBoundingClientRect()
        const scrollAmount = (() => {
          if (rect.top < topBoundary) {
            // Post is above screen, match its top to screen top
            return rect.top - topBoundary - margin
          } else if (rect.height >= bottomBoundary) {
            // Post we want to see is taller than screen so match its top to screen top
            return rect.top - topBoundary - margin
          } else if (rect.bottom > bottomBoundary) {
            // Post is below screen, match its bottom to screen bottom
            return rect.bottom - bottomBoundary + margin
          } else {
            return 0
          }
        })()

        if (scrollAmount !== 0) {
          window.scrollBy(0, scrollAmount)
        }

        return
      }

      this.clear()
      this.startFetching()
    },
    mastoUserSocketStatus(newValue) {
      if (newValue === WSConnectionStatus.JOINED) {
        this.fetchChat({ isFirstFetch: true })
      }
    },
  },
  methods: {
    // Actions
    async readChat() {
      if (this.conversationId) return // Unsupported
      if (!this.maxId || document.hidden) {
        return
      }
      const lastReadId = this.maxId
      const isNewMessage = this.lastReadMessageId !== lastReadId

      if (!isNewMessage) return

      if (!this.testMode) {
        await readChat({
          id: this.chat.id,
          lastReadId,
          credentials: useOAuthStore().token,
        })
      }

      useChatsStore().readChat(this.chat.id)
      this.lastReadMessageId = this.maxId
      this.newMessageCount = 0
    },
    scrollDown(options = {}) {
      const { behavior = 'auto', forceRead = false } = options
      this.$nextTick(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior,
        })
      })
      if (forceRead) {
        this.readChat()
      }
    },
    cullOlder() {
      const maxIndex = this.messages.length
      const minIndex = maxIndex - 50
      if (maxIndex <= 50) return

      this.messages = sortBy(this.messages, ['id'])
      this.minId = this.messages[minIndex].id

      for (const message of this.messages) {
        if (message.id < this.minId) {
          delete this.messagesIndex[message.id]
          delete this.idempotencyKeyIndex[message.idempotency_key]
        }
      }

      this.messages = this.messages.slice(minIndex, maxIndex)
    },
    clear() {
      this.messages = this.messages.filter((m) => m.error)
      this.messagesIndex = this.messages.reduce(
        (acc, m) => ({
          ...acc,
          [m.id]: m,
        }),
        {},
      )
      this.newMessageCount = 0
      this.lastReadMessageId = null
      this.minId = undefined
      this.maxId = undefined
    },
    async fetchChat({ isFirstFetch = false, fetchLatest = false, maxId }) {
      if (fetchLatest && this.streamingEnabled) {
        return
      }

      let messages
      if (this.isConversation) {
        const [
          { data: status },
          {
            data: { ancestors, descendants },
          },
        ] = await Promise.all([
          fetchStatus({
            id: this.statusId,
            credentials: useOAuthStore().token,
          }),
          fetchConversation({
            id: this.statusId,
            credentials: useOAuthStore().token,
          }),
        ])
        messages = [...ancestors, status, ...descendants]
      } else {
        const { data } = await chatMessages({
          id: this.chat.id,
          maxId,
          sinceId: fetchLatest ? this.maxId : null,
          credentials: useOAuthStore().token,
        })
        messages = data
      }

      // Clear the current chat in case we're recovering from a ws connection loss.
      if (isFirstFetch) {
        this.clear()
      }

      const positionBeforeUpdate = getScrollPosition()
      this.addMessages({ messages })

      await nextTick()
      if (isFirstFetch) {
        this.scrollDown()
      }

      const fetchOlderMessages = !!maxId
      if (fetchOlderMessages) {
        this.handleScrollUp(positionBeforeUpdate)
      }

      // In vertical screens, the first batch of fetched messages may not always take the
      // full height of the scrollable container.
      // If this is the case, we want to fetch the messages until the scrollable container
      // is fully populated so that the user has the ability to scroll up and load the history.
      //
      // Conversation fetching doesn't support pagination and spews out everything at once
      // so we both can't and don't need to fetch previous posts
      if (!this.isConversation && !isScrollable() && messages.length > 0) {
        this.fetchChat({
          maxId: this.minId,
        })
      }
    },
    async startFetching() {
      console.log(this.statusId, this.chatUserId)
      if (!this.isConversation) {
        try {
          const { data } = await getOrCreateChat({
            accountId: this.chatUserId,
            credentials: useOAuthStore().token,
          })
          this.$store.commit('addNewUsers', [data.account])
          data.account = this.$store.getters.findUser(data.account.id)
          this.chat = data
        } catch (e) {
          console.error('Error creating or getting a chat', e)
          this.errorLoadingChat = true
        }
      }

      if (this.isConversation || this.chat) {
        this.$nextTick(() => {
          this.scrollDown({ forceRead: true })
        })
        this.doStartFetching()
      }
    },
    doStartFetching() {
      this.fetcher = promiseInterval(
        () => this.fetchChat({ fetchLatest: true }),
        5000,
      )
      this.fetchChat({ isFirstFetch: true })
    },
    addMessages({ messages: newMessages }) {
      for (let i = 0; i < newMessages.length; i++) {
        const message = newMessages[i]

        // Sanity check
        if (!this.isConversation && message.chat_id !== this.chat.id) {
          console.warn(
            `Chat message doesn't belong to current chat (id: ${this.chat.id})!!`,
            message,
          )
          return
        }

        // Clear any known pending messages
        if (message.idempotency_key) {
          if (this.pendingMessagesIndex[message.idempotencyKeyIndex]) {
            delete this.pendingMessagesIndex[message.idempotencyKeyIndex]
            this.pendingMessages = this.pendingMessages.filter(
              ({ idempotency_key }) =>
                idempotency_key !== message.idempotency_key,
            )
          }
        }

        if (!this.minId || (!message.pending && message.id < this.minId)) {
          this.minId = message.id
        }

        if (!this.maxId || message.id > this.maxId) {
          this.maxId = message.id
        }

        if (!this.messagesIndex[message.id] && !isConfirmation(this, message)) {
          if (this.lastReadMessageId < message.id) {
            this.newMessageCount++
          }
          this.messagesIndex[message.id] = message
          this.messages.push(this.messagesIndex[message.id])
          this.idempotencyKeyIndex[message.idempotency_key] = true
        }
      }
    },
    goBack() {
      this.$router.back()
    },

    // Optimistic posting (chats only)
    async sendMessage({ status, media, idempotencyKey }) {
      const params = {
        id: this.chat.id,
        content: status,
        idempotencyKey,
      }

      if (media[0]) {
        params.mediaId = media[0].id
      }

      const fakeMessage = buildFakeMessage({
        attachments: media,
        chatId: this.chat.id,
        content: status,
        userId: this.currentUser.id,
        idempotencyKey,
      })

      this.pendingMessages.push(fakeMessage)
      this.pendingMessagesIndex[idempotencyKey] = fakeMessage

      this.handleAttachmentPosting()

      return this.doSendMessage({
        params,
        retriesLeft: MAX_RETRIES,
      })
    },
    async doSendMessage({ params, retriesLeft = MAX_RETRIES }) {
      if (retriesLeft <= 0) return

      try {
        const { data } = await sendChatMessage({
          ...params,
          credentials: useOAuthStore().token,
        })

        this.addMessages({
          messages: [{ ...data }],
        })
      } catch (error) {
        if (
          error.name !== 'StatusCodeError' ||
          error.message === 'Failed to fetch'
        )
          throw error
        console.error('Error sending message', error)

        this.handleMessageError({
          chatId: this.chat.id,
          idempotencyKey: params.idempotencyKey,
          isRetry: retriesLeft !== MAX_RETRIES,
        })

        if (
          (error.statusCode >= 500 && error.statusCode < 600) ||
          error.message === 'Failed to fetch'
        ) {
          this.messageRetriers[params.idempotencyKey] = setTimeout(
            () => {
              this.doSendMessage({
                params,
                retriesLeft: retriesLeft - 1,
              })
            },
            1000 * 2 ** (MAX_RETRIES - retriesLeft),
          )
        }
      }
    },
    handleMessageError(idempotencyKey, isRetry) {
      const fakeMessage = this.pendingMessagesIndex[idempotencyKey]

      if (fakeMessage) {
        fakeMessage.error = true
        fakeMessage.pending = false
      }
    },

    // Checks
    hasReachedTop() {
      return window.scrollY <= 0
    },
    cullOlderCheck() {
      if (this.conversationId) return
      window.setTimeout(() => {
        if (isBottomedOut(JUMP_TO_BOTTOM_BUTTON_VISIBILITY_OFFSET)) {
          this.cullOlder()
        }
      }, 5000)
    },

    // Event handlers
    onPosted(data) {
      this.explicitReplyStatus = null
      this.$router.push({
        name: 'conversation2',
        params: { statusId: data.id },
      })
    },
    handleVisibilityChange() {
      this.$nextTick(() => {
        if (!document.hidden && isBottomedOut(BOTTOMED_OUT_OFFSET)) {
          this.scrollDown({ forceRead: true })
        }
      })
    },
    onFilesDropped() {
      this.$nextTick(() => {
        this.handleResize()
      })
    },
    handleResize(opts = {}) {
      // "Sticks" scroll to bottom instead of top, helps with OSK resizing the viewport
      const { delayed = false } = opts

      if (delayed) {
        setTimeout(() => {
          this.handleResize({ ...opts, delayed: false })
        }, SAFE_RESIZE_TIME_OFFSET)
        return
      }

      this.$nextTick(() => {
        const { offsetHeight = undefined } = getScrollPosition()
        const diff = offsetHeight - this.lastScrollPosition.offsetHeight
        if (diff !== 0 && !isBottomedOut()) {
          this.$nextTick(() => {
            window.scrollBy({ top: -Math.trunc(diff) })
          })
        }
        this.lastScrollPosition = getScrollPosition()
      })
    },
    handleScroll: throttle(function () {
      if (!this.chat) {
        return
      }
      this.lastScrollPosition = getScrollPosition()

      if (this.hasReachedTop()) {
        this.fetchChat({ maxId: this.minId })
      } else if (isBottomedOut(JUMP_TO_BOTTOM_BUTTON_VISIBILITY_OFFSET)) {
        this.jumpToBottomButtonVisible = false
        this.cullOlderCheck()
        if (this.newMessageCount > 0) {
          // Use a delay before marking as read to prevent situation where new messages
          // arrive just as you're leaving the view and messages that you didn't actually
          // get to see get marked as read.
          window.setTimeout(() => {
            // Don't mark as read if the element doesn't exist, user has left chat view
            if (this.$el) this.readChat()
          }, MARK_AS_READ_DELAY)
        }
      } else {
        this.jumpToBottomButtonVisible = true
      }
    }, 200),
    handleScrollUp(positionBeforeLoading) {
      const positionAfterLoading = getScrollPosition()

      window.scrollTo({
        top: getNewTopPosition(positionBeforeLoading, positionAfterLoading),
      })
    },
    handleAttachmentPosting() {
      this.$nextTick(() => {
        this.handleResize()
        // When the posting form size changes because of a media attachment, we need an extra resize
        // to account for the potential delay in the DOM update.
        this.scrollDown({ forceRead: true })
      })
    },

    // Ugly
    // TODO move to ChatMessage
    async deleteChatMessage({ chatId, messageId }) {
      if (!this.testMode)
        await deleteChatMessage({
          chatId,
          messageId,
          credentials: useOAuthStore().token,
        })

      this.messages = this.messages.filter((m) => m.id !== messageId)
      delete this.messagesIndex[messageId]

      if (this.maxId === messageId) {
        const lastMessage = maxBy(this.messages, 'id')
        this.maxId = lastMessage.id
      }

      if (this.minId === messageId) {
        const firstMessage = minBy(this.messages, 'id')
        this.minId = firstMessage.id
      }
    },
  },
}

export default Chat
