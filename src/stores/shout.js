import { Socket } from 'phoenix'
import { defineStore } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useUsersStore } from 'src/stores/users.js'

import { streamingUrl } from 'src/api/api_base.js'

// Maybe rename it to PhoenixSocket if we ever utilize this socket more
export const useShoutStore = defineStore('shout', {
  state: () => ({
    messages: [],
    channel: { state: '' },
    joined: false,
    socket: null,
  }),
  getters: {
    token: () => useUsersStore().currentUser?.token,
  },
  actions: {
    initializeSocket() {
      if (this.token === null) return
      if (!useInstanceCapabilitiesStore().shoutAvailable) return
      // the instance's socket refuses other sites (Pleroma's origin check)
      if (useInstanceStore().hosted) return
      if (this.socket !== null) return

      this.socket = new Socket(streamingUrl('/socket'), {
        params: { token: this.token },
      })
      this.socket.connect()
    },
    initializeShout() {
      if (this.socket === null) return

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
    },
  },
})
