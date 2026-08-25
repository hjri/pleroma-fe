import { first, last } from 'lodash'
import { defineStore } from 'pinia'

import timelineFetcher from 'src/stores/fetchers/timeline_fetcher.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { TIMELINE_STREAM_MAP, useStreamingStore } from 'src/stores/streaming.js'

const emptyTl = (name, argument = null) => {
  const result = {
    name,
    order: [],
    statusIds: new Set(),
    visibleStatusIds: new Set(),
    newStatusCount: 0,
    maxId: '',
    minId: '',
    streaming: false,
    fetching: false,
    reloadNeeded: false,
    fetcher: null,
    socket: null,
    paused: false,
  }

  const property = ARGUMENT_MAP[name]

  if (property) {
    result[property] = argument
  }

  if (name === 'dms' || name === 'friends') {
    result.persistent = true
  }

  return result
}

export const ARGUMENT_MAP = {
  tag: 'tag',
  list: 'listId',
  bookmarks: 'bookmarkFolderId',
  quotes: 'statusId',
  search: 'query',
  user: 'userId',
  userPinned: 'userId',
  media: 'userId',
}

const TIMELINES = new Set([
  'mentions',
  'public',
  'user',
  'userPinned',
  'media',
  'favorites',
  'publicAndExternal',
  'friends',
  'tag',
  'dms',
  'bookmarks',
  'list',
  'bubble',
  'quotes',
  'search',
])

export const defaultState = () => {
  return Object.fromEntries([...TIMELINES].map((name) => [name, emptyTl(name)]))
}

//const CUSTOM_SORT = new Set(['bookmarks', 'favorites'])

export const useTimelinesStore = defineStore('timelines', {
  state: defaultState,
  actions: {
    // (De)Initialization stuff
    activate(timelineName, argument, persistent) {
      const timeline = this[timelineName]
      if (timeline.persistent && !persistent) return

      if (
        timelineName === 'favourites' &&
        !useInstanceCapabilitiesStore().pleromaPublicFavouritesAvailable
      ) {
        console.warn("Instance doesn't support public favorites timeline")
        return
      }

      const property = ARGUMENT_MAP[timelineName]
      if (property) {
        timeline[property] = argument
      }

      timeline.fetcher = timelineFetcher(
        timeline,
        argument,
        useOAuthStore().token,
      )

      this.startFetchingTimeline(timelineName, argument, 'Timeline activated')

      const streamName = TIMELINE_STREAM_MAP[timelineName]

      if (streamName) {
        const et = new EventTarget()
        const openHandler = () => this.onStreamConnect(timelineName, argument)
        const closeHandler = () =>
          this.onStreamDisconnect(timelineName, argument)
        const messageHandler = (message) => {
          this.onStreamMessage(timelineName, argument, message)
        }

        et.addEventListener('open', openHandler)
        et.addEventListener('close', closeHandler)
        et.addEventListener('update', messageHandler)

        timeline.socket = {
          name: 'timelines',
          stream: {
            name: streamName,
            argument,
          },
          et,
          handlers: {
            openHandler,
            closeHandler,
            messageHandler,
          },
        }

        useStreamingStore().addSubscriber(timeline.socket)
      }
    },
    deactivate(timelineName, persistent) {
      const timeline = this[timelineName]
      if (timeline.persistent && !persistent) return
      if (timeline.fetching) {
        this.stopFetchingTimeline(timelineName, 'Timeline deactivation')
      }

      if (timeline.socket) {
        useStreamingStore().removeSubscriber(timeline.socket)

        const { openHandler, closeHandler, messageHandler } =
          timeline.socket.handlers
        timeline.socket.et.removeEventListener('open', openHandler)
        timeline.socket.et.removeEventListener('close', closeHandler)
        timeline.socket.et.removeEventListener('message', messageHandler)
      }

      this[timelineName] = emptyTl(timelineName)
    },
    clearTimeline(timelineName) {
      const timeline = this[timelineName]

      timeline.order = []
      timeline.statusIds = new Set()
      timeline.visibleStatusIds = new Set()
      timeline.newStatusCount = 0
      timeline.maxId = ''
      timeline.minId = ''
      timeline.reloadNeeded = false
    },
    activatePersistents() {
      TIMELINES.forEach((name) => {
        if (this[name].persistent) {
          this.activate(name, undefined, true)
        }
      })
    },
    deactivateAll() {
      TIMELINES.forEach((name) => {
        try {
          this.deactivate(name, true)
        } catch (e) {
          console.error(`Failed to deactivate timeline ${name}:`, e)
        }
      })
    },

    // Pause
    pause(name) {
      const timeline = this[name]
      timeline.paused = true
      console.debug('[Timelines] Pausing timeline', name)
      if (timeline.fetcher && timeline.fetching) {
        timeline.fetcher.stopFetching()
      }
    },
    resume(name) {
      const timeline = this[name]
      timeline.paused = false
      console.debug('[Timelines] Resuming timeline', name)
      if (timeline.fetcher && timeline.fetching) {
        timeline.fetcher.startFetching()
      }
    },
    pauseAll() {
      TIMELINES.forEach((name) => {
        try {
          this.pause(name)
        } catch (e) {
          console.error(`[Timelines] Failed to pause timeline ${name}:`, e)
        }
      })
    },
    resumeAll() {
      TIMELINES.forEach((name) => {
        try {
          this.resume(name)
        } catch (e) {
          console.error(`[Timelines] Failed to pause timeline ${name}:`, e)
        }
      })
    },

    // Update stuff
    addStatusesToTimeline(
      timelineName,
      argument,
      {
        statuses,
        showImmediately = false,
        noIdUpdate = false,
        pagination = {},
        older = false,
      },
    ) {
      if (statuses.length === 0) return
      const timeline = this[timelineName]

      // This makes sure that user timeline won't get data meant for other
      // user. I.e. opening different user profiles makes request which could
      // return data late after user already viewing different user profile
      // Same can happen with tags etc.
      const property = ARGUMENT_MAP[timelineName]

      if (property && timeline[property] !== argument) {
        return
      }

      if (!noIdUpdate) {
        this.updateTimelineExtremes(timeline, pagination)
      }

      const filtered = statuses.filter((id) => !timeline.statusIds.has(id))
      if (older) {
        timeline.order.push(...filtered)
      } else {
        timeline.order.unshift(...filtered)
      }

      statuses.forEach((statusId) => {
        const isNew = !timeline.statusIds.has(statusId)
        timeline.statusIds.add(statusId)

        if (isNew) {
          if (showImmediately) {
            // Add it directly to the visibleStatuses, don't change
            // newStatusCount
            timeline.visibleStatusIds.add(statusId)
          } else {
            // Just change newStatuscount
            timeline.newStatusCount += 1
          }
        }
      })
    },
    onStreamMessage(timeline, argument, event) {
      this.addStatusesToTimeline(timeline, argument, {
        statuses: event.data.map(({ id }) => id),
      })
    },

    // Poll & Push
    onStreamConnect(timeline) {
      console.debug('[Timelines] Stream connected', timeline)
      this[timeline].streaming = true
      this.stopFetchingTimeline(timeline, 'Socket connected')
    },
    onStreamDisconnect(timeline, argument) {
      this[timeline].streaming = false
      this.startFetchingTimeline(timeline, argument, 'Socket disconnected')
    },
    startFetchingTimeline(timelineName, argument, reason) {
      const timeline = this[timelineName]
      if (timeline.paused) {
        console.debug(
          '[Timelines] NOT Starting timeline fetcher because it is paused',
          timelineName,
          argument,
          'Original Reason:',
          reason,
        )
        return
      }

      console.debug(
        '[Timelines] Starting timeline fetcher',
        timelineName,
        argument,
        'Reason:',
        reason,
      )
      timeline.fetcher.startFetching()
      timeline.fetching = true
    },
    stopFetchingTimeline(timelineName, reason) {
      const timeline = this[timelineName]
      if (timeline.fetcher === null) {
        console.debug(
          '[Timelines] Already inactive timeline',
          timelineName,
          'Reason:',
          reason,
        )
        return
      } else {
        timeline.fetcher.stopFetching()
        console.debug(
          '[Timelines] Stopped fetching timeline',
          timelineName,
          'Reason:',
          reason,
        )
        timeline.fetching = false
      }
    },

    // Queues & Timeline manip
    updateTimelineExtremes(timeline, pagination = {}) {
      // Can't use Math.min/max because it doesn't work with string (duh)
      const minNew = pagination.maxId ?? last(timeline.order) ?? ''
      const maxNew = pagination.minId ?? first(timeline.order) ?? ''

      const newer = maxNew > timeline.maxId
      const older = minNew < timeline.minId

      if (newer || timeline.maxId === '') {
        timeline.maxId = maxNew
      }
      if (older || timeline.minId === '') {
        timeline.minId = minNew
      }

      this.syncOrder(timeline)
    },
    showNewStatuses(timelineName) {
      const timeline = this[timelineName]

      timeline.newStatusCount = 0
      timeline.visibleStatusIds = new Set([...timeline.statusIds])
    },
    syncOrder(timeline) {
      timeline.order = timeline.order.filter((id) => timeline.statusIds.has(id))
    },
    requireReload(timeline, id) {
      this[timeline].reloadNeeded = true
    },
    requireReloadAll() {
      Object.keys(this).forEach((timeline) => {
        this[timeline].reloadNeeded = true
      })
    },

    // Misc
    wipeStatuses(ids) {
      TIMELINES.forEach((timelineName) => {
        const timeline = this[timelineName]

        ids.forEach((id) => {
          timeline.statusIds.delete(id)
          timeline.visibleStatusIds.delete(id)
        })

        this.syncOrder(timeline)
      })
    },
  },
})
