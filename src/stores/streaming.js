import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import {
  getMastodonSocketURI,
  ProcessedWS,
  WSConnectionStatus,
} from 'src/api/websocket.js'

const ARGUMENT_MAP = {
  tag: 'tag',
  list: 'list',
}

export const TIMELINE_STREAM_MAP = {
  friends: 'user',
  public: 'public',
  tag: 'hashtag',
  list: 'list',
  dms: 'direct',
}

const retryTimeout = (multiplier) => 1000 * multiplier

export const useStreamingStore = defineStore('streaming', {
  state: () => ({
    socket: null,
    error: null,
    state: null,
    retryMultiplier: 1,
    subscribers: new Set(),
    subscriptions: new Map(),
    globalSubscriptions: new Set(),
  }),
  actions: {
    addSubscriber(subscriber) {
      const { stream, et } = subscriber

      if (stream) {
        if (!this.subscriptions.has(stream.name)) {
          this.subscriptions.set(stream.name, new Map())
        }

        const streamSubs = this.subscriptions.get(stream.name)

        if (streamSubs.has(stream.argument)) {
          throw new Error('Subscription already exists!')
        }

        streamSubs.set(stream.argument, subscriber)
      } else {
        this.globalSubscriptions.add(subscriber)
      }

      this.subscribers.add(subscriber)
      if (this.state === WSConnectionStatus.JOINED) {
        this.socket.subscribe(...this.getSubArgs(stream))
        subscriber.et.dispatchEvent(new CustomEvent('open'))
      }
    },
    removeSubscriber(subscriber) {
      const { stream, et } = subscriber

      this.subscribers.delete(subscriber)
      this.subscriptions.get(stream.name).delete(stream.argument)

      if (this.state === WSConnectionStatus.JOINED) {
        this.socket.unsubscribe(...this.getSubArgs(stream))
      }
    },
    initSocket(initial) {
      this.state = initial
        ? WSConnectionStatus.STARTING_INITIAL
        : WSConnectionStatus.STARTING

      const credentials = useOAuthStore().token
      const url = getMastodonSocketURI({ credentials })

      this.socket = ProcessedWS({
        url,
        id: 'Unified',
        credentials,
      })

      this.socket.addEventListener('pleroma:authenticated', this.onAuth)
      this.socket.addEventListener('open', this.onOpen)
      this.socket.addEventListener('close', this.onClose)
      this.socket.addEventListener('message', this.onMessage)
      this.socket.addEventListener('error', this.onError)
    },
    stopSocket() {
      this.socket.close()
    },

    getSubArgs(stream) {
      const argumentKey = ARGUMENT_MAP[stream.name]
      const args = argumentKey
        ? {
            [argumentKey]: stream.argument,
          }
        : null

      return [stream.name, args]
    },
    onAuth() {
      this.subscribers.forEach(({ stream, et }) => {
        et.dispatchEvent(new CustomEvent('authenticated'))

        if (stream) {
          this.socket.subscribe(...this.getSubArgs(stream))
        }
      })
      this.state = WSConnectionStatus.JOINED
    },
    onOpen() {
      this.subscribers.forEach(({ stream, et }) => {
        et.dispatchEvent(new CustomEvent('open'))
      })
    },
    onMessage({ detail: message }) {
      if (!message) return // pings
      const timestamp = Date.now()
      const { event: eventName, stream: eventStream, ...data } = message
      const [streamName, streamArgument] = eventStream ?? []

      const subscriber = this.subscriptions.get(streamName)?.get(streamArgument)

      const totalSubs = [
        ...this.globalSubscriptions.values(),
        subscriber
      ].filter(Boolean)

      totalSubs.forEach(({ stream, et }) => {
        et.dispatchEvent(new CustomEvent(
          eventName,
          {
            detail: { streamName, streamArgument, data, timestamp },
          }
        ))
      })

      console.log('WS', message)
    },
    onError({ detail: error }) {
      this.subscribers.forEach(({ stream, et }) => {
        et.dispatchEvent(new CustomEvent('error', error))
      })
      console.error('Error in MastoAPI websocket:', error)
    },
    onClose({ detail: closeEvent }) {
      const ignoreCodes = new Set([
        1000, // Normal (intended) closure
        1001, // Going away
      ])
      const { code } = closeEvent

      if (ignoreCodes.has(code)) {
        console.debug(
          `Not restarting socket becasue of closure code ${code} is in ignore list`,
        )

        this.state = WSConnectionStatus.CLOSED

        this.subscribers.forEach(({ et }) => {
          et.dispatchEvent(new CustomEvent('close', closeEvent))
        })
      } else {
        console.warn(
          `MastoAPI websocket disconnected, restarting. CloseEvent code: ${code}`,
        )

        setTimeout(() => {
          this.initSocket()
        }, retryTimeout(this.retryMultiplier))

        this.retryMultiplier += 1

        if (this.state !== WSConnectionStatus.ERROR) {
          this.subscribers.forEach(({ et }) => {
            et.dispatchEvent(new CustomEvent('close', closeEvent))
          })
        }

        this.state = WSConnectionStatus.ERROR
      }
    },
  },
})
