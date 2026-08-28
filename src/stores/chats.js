import { orderBy, sumBy } from 'lodash'
import { defineStore } from 'pinia'

import { maybeShowChatNotification } from '../services/chat_utils/chat_utils.js'
import { promiseInterval } from '../services/promise_interval/promise_interval.js'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import { chats } from 'src/api/chats.js'

const defaultState = {
  data: new Map(),
  fetcher: null,
}

export const useChatsStore = defineStore('chats', {
  state: () => ({ ...defaultState }),
  getters: {
    sortedChatList(state) {
      return orderBy([...state.data.values()], ['updated_at'], ['desc'])
    },
    unreadChatsCount(state) {
      return sumBy([...state.data.values()], 'unread')
    },
  },
  actions: {
    attachSocket() {
      const et = new EventTarget()
      const socket = {
        name: 'chats',
        et,
      }

      et.addEventListener('pleroma:chat_update', ({ data: { chatUpdate } }) => {
        this.updateChat(chatUpdate)
      })

      useStreamingStore().addSubscriber(socket)
    },
    startFetching() {
      this.fetcher = promiseInterval(() => this.fetchChats(), 5000)
      this.fetchChats()
    },
    stopFetching() {
      this.fetcher?.stop()
      this.fetcher = null
    },
    async fetchChats() {
      this.addNewChats(
        await chats({
          credentials: useOAuthStore().token,
        }),
      )
    },
    resetChats() {
      this.data = new Map()
    },
    addNewChats(result) {
      useUsersStore().addNewUsers({
        ...result,
        data: result.data.map((k) => k.account).filter(Boolean),
      })

      // We do unshift in update so we reverse the chat list here
      result.data.forEach((chat) => this.updateChat(chat))
    },
    readChat(id) {
      const chat = this.data.get(id)
      if (chat) {
        chat.unread = 0
      } else {
        console.error(`Chat ${id} not found!`)
      }
    },
    updateChat(updatedChat) {
      const chat = this.data.get(updatedChat.id)
      if (chat) {
        const isNewMessage =
          chat.lastMessage?.id !== updatedChat.lastMessage?.id
        chat.lastMessage = updatedChat.lastMessage
        chat.unread = updatedChat.unread
        chat.updated_at = updatedChat.updated_at
        if (isNewMessage) maybeShowChatNotification(chat)
      } else {
        this.data.set(updatedChat.id, updatedChat)
        maybeShowChatNotification(updatedChat)
      }
    },
    deleteChat(id) {
      this.data.delete(id)
    },
  },
})
