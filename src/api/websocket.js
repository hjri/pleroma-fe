import { paramsString } from './helpers.js'

import {
  parseChat,
  parseNotification,
  parseStatus,
} from 'src/services/entity_normalizer/entity_normalizer.service.js'

const MASTODON_STREAMING = ({ accessToken, stream }) =>
  `/api/v1/streaming${paramsString({ accessToken, stream })}`

export const getMastodonSocketURI = ({ credentials, stream }) => {
  return MASTODON_STREAMING({ accessToken: credentials, stream })
}

const MASTODON_STREAMING_EVENTS = new Set([
  'update',
  'notification',
  'delete',
  'filters_changed',
  'status.update',
])

const PLEROMA_STREAMING_EVENTS = new Set([
  'pleroma:chat_update',
  'pleroma:respond',
])

// A thin wrapper around WebSocket API that allows adding a pre-processor to it
// Uses EventTarget and a CustomEvent to proxy events
export const ProcessedWS = ({
  url,
  preprocessor = handleMastoWS,
  id = 'Unknown',
  credentials,
}) => {
  const eventTarget = new EventTarget()
  const socket = new WebSocket(url)
  if (!socket) throw new Error(`Failed to create socket ${id}`)
  const proxy = (original, eventName, processor = (a) => a) => {
    original.addEventListener(eventName, (eventData) => {
      eventTarget.dispatchEvent(
        new CustomEvent(eventName, { detail: processor(eventData) }),
      )
    })
  }
  socket.addEventListener('open', (wsEvent) => {
    console.debug(`[WS][${id}] Socket connected`, wsEvent)
    if (credentials) {
      socket.send(
        JSON.stringify({
          type: 'pleroma:authenticate',
          token: credentials,
        }),
      )
    }
  })
  socket.addEventListener('error', (wsEvent) => {
    console.debug(`[WS][${id}] Socket errored`, wsEvent)
  })
  socket.addEventListener('close', (wsEvent) => {
    console.debug(
      `[WS][${id}] Socket disconnected with code ${wsEvent.code}`,
      wsEvent,
    )
  })
  // Commented code reason: very spammy, uncomment to enable message debug logging
  /*
  socket.addEventListener('message', (wsEvent) => {
    console.debug(
      `[WS][${id}] Message received`,
      wsEvent
    )
  })
  /**/

  const onAuthenticated = () => {
    eventTarget.dispatchEvent(new CustomEvent('pleroma:authenticated'))
  }

  proxy(socket, 'open')
  proxy(socket, 'close')
  proxy(socket, 'message', (event) => preprocessor(event, { onAuthenticated }))
  proxy(socket, 'error')

  // 1000 = Normal Closure
  eventTarget.close = () => {
    socket.close(1000, 'Shutting down socket')
  }
  eventTarget.getState = () => socket.readyState
  eventTarget.subscribe = (stream, args = {}) => {
    console.debug(`[WS][${id}] Subscribing to stream ${stream} with args`, args)
    socket.send(
      JSON.stringify({
        type: 'subscribe',
        stream,
        ...args,
      }),
    )
  }
  eventTarget.unsubscribe = (stream, args = {}) => {
    console.debug(
      `[WS][${id}] Unsubscribing from stream ${stream} with args`,
      args,
    )
    socket.send(
      JSON.stringify({
        type: 'unsubscribe',
        stream,
        ...args,
      }),
    )
  }

  return eventTarget
}

export const handleMastoWS = (
  wsEvent,
  {
    onAuthenticated = () => {
      /* no-op */
    },
  } = {},
) => {
  const { data } = wsEvent
  if (!data) return
  const parsedEvent = JSON.parse(data)
  const { event, payload } = parsedEvent
  if (
    MASTODON_STREAMING_EVENTS.has(event) ||
    PLEROMA_STREAMING_EVENTS.has(event)
  ) {
    // MastoBE and PleromaBE both send payload for delete as a PLAIN string
    if (event === 'delete') {
      return { event, id: payload }
    }
    const data = payload ? JSON.parse(payload) : null
    if (event === 'pleroma:respond') {
      if (data.type === 'pleroma:authenticate') {
        if (data.result === 'success') {
          console.debug('[WS] Successfully authenticated')
          onAuthenticated()
        } else {
          if (data.error === 'already_authenticated') {
            onAuthenticated()
          } else {
            console.error('[WS] Unable to authenticate:', data.error)
            wsEvent.target.close()
          }
        }
      }
      return null
    } else if (event === 'update') {
      return { event, status: parseStatus(data) }
    } else if (event === 'status.update') {
      return { event, status: parseStatus(data) }
    } else if (event === 'notification') {
      return { event, notification: parseNotification(data) }
    } else if (event === 'pleroma:chat_update') {
      return { event, chatUpdate: parseChat(data) }
    }
  } else {
    console.warn('Unknown event', wsEvent)
    return null
  }
}

export const WSConnectionStatus = Object.freeze({
  JOINED: 1,
  CLOSED: 2,
  ERROR: 3,
  DISABLED: 4,
  STARTING: 5,
  STARTING_INITIAL: 6,
})
