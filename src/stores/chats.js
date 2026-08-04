import { find, omitBy, orderBy, sumBy } from 'lodash'
import { defineStore } from 'pinia'

import { maybeShowChatNotification } from '../services/chat_utils/chat_utils.js'
import { promiseInterval } from '../services/promise_interval/promise_interval.js'

import { useOAuthStore } from 'src/stores/oauth.js'

import { chats } from 'src/api/chats.js'

const emptyChatList = () => ({
  data: [],
  idStore: {},
})

const defaultState = {
  chatList: emptyChatList(),
  chatListFetcher: null,
}

const getChatById = (state, id) => {
  return find(state.chatList.data, { id })
}

export const useChatsStore = defineStore('chats', {
  state: () => ({ ...defaultState }),
  getters: {
    sortedChatList(state) {
      return orderBy(state.chatList.data, ['updated_at'], ['desc'])
    },
    unreadChatsCount(state) {
      return sumBy(state.chatList.data, 'unread')
    },
  },
  actions: {
    startFetchingChats() {
      const fetcher = () => this.fetchChats()
      this.setChatListFetcher(() => promiseInterval(fetcher, 5000))
    },
    stopFetchingChats() {
      this.setChatListFetcher(null)
    },
    async fetchChats() {
      const { data } = await chats({
        credentials: useOAuthStore().token,
      })

      this.addNewChats(data)
    },
    setChatListFetcher(fetcher) {
      const prevFetcher = this.chatListFetcher
      if (prevFetcher) {
        prevFetcher.stop()
      }
      this.chatListFetcher = fetcher?.()
    },
    resetChats() {
      this.chatList = emptyChatList()
      this.setChatListFetcher(null)
    },
    addNewChats(chats) {
      window.vuex.commit(
        'addNewUsers',
        chats.map((k) => k.account).filter((k) => k),
      )

      chats.forEach((updatedChat) => {
        const chat = getChatById(this, updatedChat.id)

        if (chat) {
          const isNewMessage =
            (chat.lastMessage && chat.lastMessage.id) !==
            (updatedChat.lastMessage && updatedChat.lastMessage.id)
          chat.lastMessage = updatedChat.lastMessage
          chat.unread = updatedChat.unread
          chat.updated_at = updatedChat.updated_at
          if (isNewMessage && chat.unread) {
            maybeShowChatNotification(chat)
          }
        } else {
          this.chatList.data.push(updatedChat)
          this.chatList.idStore[updatedChat.id] = updatedChat
        }
      })
    },
    readChat(id) {
      const chat = getChatById(this, id)
      if (chat) {
        chat.unread = 0
      }
    },
    updateChat({ chat: updatedChat }) {
      const chat = getChatById(this, updatedChat.id)
      if (chat) {
        chat.lastMessage = updatedChat.lastMessage
        chat.unread = updatedChat.unread
        chat.updated_at = updatedChat.updated_at
      }
      if (!chat) {
        this.chatList.data.unshift(updatedChat)
      }
      this.chatList.idStore[updatedChat.id] = updatedChat
    },
    deleteChat(id) {
      this.chats.data = this.chats.data.filter(
        (conversation) => conversation.last_status.id !== id,
      )
      this.chats.idStore = omitBy(
        this.chats.idStore,
        (conversation) => conversation.last_status.id === id,
      )
    },
  },
})
