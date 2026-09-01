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

export class StreamStateEvent extends Event {
  original

  constructor(name, original) {
    super(name)
    this.original = original
  }
}

export class StreamErrorEvent extends Event {
  error

  constructor(error) {
    super('error', error)
    this.error = error
  }
}

export class StreamMessageEvent extends Event {
  data
  stream
  timestamp

  constructor(name, stream, data) {
    super(name)
    this.data = data
    this.stream = stream
    this.timestamp = Date.now()
  }
}

export const useStreamingStore = defineStore('streaming', {
  state: () => ({
    socket: null,
    error: null,
    state: null,
    retryMultiplier: 1,
    retrying: false,
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
        if (stream) {
          this.socket.subscribe(...this.getSubArgs(stream))
        }
        et.dispatchEvent(new StreamStateEvent('open'))
      }
    },
    removeSubscriber(subscriber) {
      const { stream } = subscriber

      this.subscribers.delete(subscriber)
      if (stream) {
        this.subscriptions.get(stream.name).delete(stream.argument)
      } else {
        this.globalSubscriptions.delete(subscriber)
      }

      if (stream && this.state === WSConnectionStatus.JOINED) {
        this.socket.unsubscribe(...this.getSubArgs(stream))
      }
    },
    initSocket(initial) {
      if (this.socket) throw new Error('Socket already exists!')

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
      this.socket = null
      this.state = WSConnectionStatus.CLOSED
      this.retrying = false
      this.retryMultiplier = 1
      this.error = null
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
        et.dispatchEvent(new StreamStateEvent('authenticated'))

        if (stream) {
          this.socket.subscribe(...this.getSubArgs(stream))
        }
      })
      this.state = WSConnectionStatus.JOINED
    },
    onOpen() {
      this.retryMultiplier = 1
      this.retrying = false
      this.error = null
      this.subscribers.forEach(({ stream, et }) => {
        et.dispatchEvent(new StreamStateEvent('open'))
      })
    },
    onMessage({ data: message }) {
      if (!message) return // pings
      const { event: eventName, stream: eventStream, ...data } = message
      const [streamName, streamArgument] = eventStream ?? []

      const subscriber = this.subscriptions.get(streamName)?.get(streamArgument)

      const totalSubs = [
        ...this.globalSubscriptions.values(),
        subscriber,
      ].filter(Boolean)

      const eventData = (() => {
        switch (eventName) {
          case 'status.update':
          case 'update':
            return [data.status]
          case 'notification':
            return [data.notification]
          case 'delete':
            return [data.id]
          default:
            return data
        }
      })()

      const event = new StreamMessageEvent(
        eventName,
        { name: streamName, argument: streamArgument },
        eventData,
      )

      totalSubs.forEach(({ stream, et }) => {
        et.dispatchEvent(event)
      })
    },
    onError({ data: error }) {
      this.subscribers.forEach(({ stream, et }) => {
        et.dispatchEvent(new StreamErrorEvent(error))
      })
      this.error = error
      console.error('Error in MastoAPI websocket:', error)
    },
    onClose({ data: closeEvent }) {
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
        this.retrying = false
        this.error = null
        this.retryMultiplier = 1

        this.subscribers.forEach(({ et }) => {
          et.dispatchEvent(new StreamStateEvent('close', closeEvent))
        })
      } else {
        console.warn(
          `MastoAPI websocket disconnected, restarting. CloseEvent code: ${code}`,
        )

        setTimeout(() => {
          if (!this.retrying) return // retry aborted (i.e. due to logout)

          this.initSocket()
        }, retryTimeout(this.retryMultiplier))

        this.retryMultiplier += 1

        if (!this.retrying) {
          this.subscribers.forEach(({ et }) => {
            et.dispatchEvent(new StreamStateEvent('close', closeEvent))
          })
        }

        this.retrying = true
        this.state = WSConnectionStatus.ERROR
      }
    },
  },
})
