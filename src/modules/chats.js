import { find, omitBy, orderBy, sumBy } from 'lodash'
import { reactive } from 'vue'

import { maybeShowChatNotification } from '../services/chat_utils/chat_utils.js'
import { promiseInterval } from '../services/promise_interval/promise_interval.js'

import { useOAuthStore } from 'src/stores/oauth.js'

import { chats, deleteChatMessage } from 'src/api/chats.js'

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

const sortedChatList = (state) => {
  return orderBy(state.chatList.data, ['updated_at'], ['desc'])
}

const unreadChatCount = (state) => {
  return sumBy(state.chatList.data, 'unread')
}

const chatsModule = {
  state: { ...defaultState },
  getters: {
    sortedChatList,
    unreadChatCount,
  },
  actions: {
    // Chat list
    startFetchingChats({ dispatch, commit }) {
      const fetcher = () => dispatch('fetchChats', { latest: true })
      commit('setChatListFetcher', {
        fetcher: () => promiseInterval(fetcher, 5000),
      })
    },
    stopFetchingChats({ commit }) {
      commit('setChatListFetcher', { fetcher: undefined })
    },
    fetchChats({ dispatch, rootState }) {
      return chats({
        credentials: useOAuthStore().token,
      }).then(({ data }) => {
        dispatch('addNewChats', { chats: data })
        return chats
      })
    },
    addNewChats(store, { chats }) {
      const { commit, dispatch, rootGetters } = store
      const newChatMessageSideEffects = (chat) => {
        maybeShowChatNotification(store, chat)
      }
      commit(
        'addNewUsers',
        chats.map((k) => k.account).filter((k) => k),
      )
      commit('addNewChats', {
        dispatch,
        chats,
        rootGetters,
        newChatMessageSideEffects,
      })
    },
  },
  mutations: {
    setChatListFetcher(state, { fetcher }) {
      const prevFetcher = state.chatListFetcher
      if (prevFetcher) {
        prevFetcher.stop()
      }
      state.chatListFetcher = fetcher && fetcher()
    },
    addNewChats(state, { chats, newChatMessageSideEffects }) {
      chats.forEach((updatedChat) => {
        const chat = getChatById(state, updatedChat.id)

        if (chat) {
          const isNewMessage =
            (chat.lastMessage && chat.lastMessage.id) !==
            (updatedChat.lastMessage && updatedChat.lastMessage.id)
          chat.lastMessage = updatedChat.lastMessage
          chat.unread = updatedChat.unread
          chat.updated_at = updatedChat.updated_at
          if (isNewMessage && chat.unread) {
            newChatMessageSideEffects(updatedChat)
          }
        } else {
          state.chatList.data.push(updatedChat)
          state.chatList.idStore[updatedChat.id] = updatedChat
        }
      })
    },
    updateChat(state, { chat: updatedChat }) {
      const chat = getChatById(state, updatedChat.id)
      if (chat) {
        chat.lastMessage = updatedChat.lastMessage
        chat.unread = updatedChat.unread
        chat.updated_at = updatedChat.updated_at
      }
      if (!chat) {
        state.chatList.data.unshift(updatedChat)
      }
      state.chatList.idStore[updatedChat.id] = updatedChat
    },
    deleteChat(state, { id }) {
      state.chats.data = state.chats.data.filter(
        (conversation) => conversation.last_status.id !== id,
      )
      state.chats.idStore = omitBy(
        state.chats.idStore,
        (conversation) => conversation.last_status.id === id,
      )
    },
    resetChats(state, { commit }) {
      state.chatList = emptyChatList()
      state.currentChatId = null
      commit('setChatListFetcher', { fetcher: undefined })
    },
    setChatsLoading(state, { value }) {
      state.chats.loading = value
    },
    readChat(state, { id, lastReadId }) {
      const chat = getChatById(state, id)
      if (chat) {
        chat.unread = 0
      }
    },
  },
}

export default chatsModule
