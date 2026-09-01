import { mapState } from 'pinia'

import ChatListItem from 'src/components/chat_list_item/chat_list_item.vue'
import ChatNew from 'src/components/chat_new/chat_new.vue'
import List from 'src/components/list/list.vue'

import { useChatsStore } from 'src/stores/chats.js'
import { useUsersStore } from 'src/stores/users.js'

const ChatList = {
  components: {
    ChatListItem,
    List,
    ChatNew,
  },
  computed: {
    ...mapState(useUsersStore, ['currentUser']),
    ...mapState(useChatsStore, ['sortedChatList']),
  },
  data() {
    return {
      isNew: false,
    }
  },
  created() {
    useChatsStore().fetchChats()
  },
  methods: {
    cancelNewChat() {
      this.isNew = false
      useChatsStore().fetchChats()
    },
    newChat() {
      this.isNew = true
    },
  },
}

export default ChatList
