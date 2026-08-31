import { Socket } from 'phoenix'

import { defineStore } from 'pinia'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useUsersStore } from 'src/stores/users.js'

// Maybe rename it to PhoenixSocket if we ever utilize this socket more
export const useShoutStore = defineStore('shout', {
  state: () => ({
    messages: [],
    channel: { state: '' },
    joined: false,
    token: null,
    socket: null,
  }),
  getters: {
    token: () => useUsersStore().currentUser?.token
  },
  actions: {
    initializeSocket() {
      if (this.token === null) return
      if (!useInstanceCapabilitiesStore().shoutAvailable) return
      if (this.socket !== null) throw new Error('Shout socket already exist!')

      this.socket = new Socket('/socket', { params: { token: this.token } })
      this.socket.connect()
    },
    initializeShout() {
      const channel = this.socket.channel('chat:public')

      channel.joinPush.receive('ok', () => {
        this.joined = true
      })
      channel.onClose(() => {
        this.joined = false
      })
      channel.onError(() => {
        this.joined = false
      })
      channel.on('new_msg', (msg) => {
        this.messages.push(msg)
        this.messages = this.messages.slice(-19, 20)
      })
      channel.on('messages', ({ messages }) => {
        this.messages = messages.slice(-19, 20)
      })
      channel.join()
      this.channel = channel
    },
    disconnectSocket() {
      this.socket?.disconnect()
      this.socket = null
    }
  },
})
