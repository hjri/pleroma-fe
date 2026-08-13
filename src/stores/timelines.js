import { first, last, max, min } from 'lodash'
import { defineStore } from 'pinia'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { TIMELINE_STREAM_MAP, useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import timelineFetcher from 'src/services/timeline_fetcher/timeline_fetcher.service.js'

const emptyTl = (name, argument = null) => {
  const result = {
    name,
    statuses: new Map(),
    visibleStatusesIds: new Set(),
    newStatusCount: 0,
    maxId: '',
    minId: '',
    minVisibleId: '',
    loading: false,
    streaming: false,
    flushMarker: 0,
    fetcher: null,
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
        return
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
        const closeHandler = () => this.onStreamDisconnect(timelineName, argument)
        const messageHandler = () => ({ detail: message }) =>
          this.onStreamMessage(timelineName, argument, message)

        et.addEventListener('open', openHandler)
        et.addEventListener('close', closeHandler)
        et.addEventListener('update', messageHandler)

        timeline.socket = {
          stream: {
            name: streamName,
            argument,
          },
          et,
          handlers: {
            openHandler,
            closeHandler,
            messageHandler,
          }
        }

        useStreamingStore().addSubscriber(timeline.socket)
      }
    },
    deactivate(timelineName, persistent) {
      const timeline = this[timelineName]
      if (timeline.persistent && !persistent) return
      if (!timeline.streaming) {
        this.stopFetchingTimeline(timelineName, 'Timeline deactivation')
      }

      if (data.socket) {
        useStreamingStore().removeSubscriber(timeline.socket)
        const { openHandler, closeHandler, messageHandler } = timeline.socket.handlers
        et.removeEventListener('open', openHandler)
        et.removeEventListener('close', closeHandler)
        et.removeEventListener('message', messageHandler)
      }

      this[timelineName] = emptyTl(timelineName)
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
        this.deactivate(name, true)
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
        nested = false,
      },
    ) {
      if (statuses.length === 0) return
      const timeline = this[timelineName]

      // This makes sure that user timeline won't get data meant for other
      // user. I.e. opening different user profiles makes request which could
      // return data late after user already viewing different user profile
      // Same can happen with tags etc.
      const property = ARGUMENT_MAP[name]

      if (property && timeline[property] !== argument) {
        return
      }

      if (!noIdUpdate) {
        this.updateTimelineExtremes(
          timeline,
          statuses.map((x) => x.id),
          pagination,
        )
      }

      statuses.forEach((status) => {
        const isNew = !timeline.statuses.has(status.id)
        timeline.statuses.set(status.id, status)

        if (isNew) {
          if (showImmediately) {
            // Add it directly to the visibleStatuses, don't change
            // newStatusCount
            timeline.visibleStatusesIds.add(status.id)
          } else {
            // Just change newStatuscount
            timeline.newStatusCount += 1
          }
        }

        if (nested) return
        // We are mentioned in a post
        if (
          status.type === 'status' &&
          status.attentions.some(
            ({ id }) => id === useUsersStore().currentUser?.id,
          )
        ) {
          // Add the mention to the mentions timeline
          if (timeline !== this.mentions) {
            this.addStatusesToTimeline('mentions', null, {
              statuses,
              nested: true,
            })
          }
        }

        if (status.visibility === 'direct') {
          if (timeline !== this.dms) {
            this.addStatusesToTimeline('dms', null, { statuses, nested: true })
          }
        }
      })
    },
    onStreamMessage(timeline, argument, event) {
      // This relies on statuses store to process this event first
      const status = useStatusesStore().allStatuses.get(event.data.status.id)

      this.addStatusesToTimeline(timeline, argument, {
        statuses: [status],
      })
    },

    // Poll & Push
    onStreamConnect(timeline) {
      console.debug('[Timelines] Stream connected', timeline)
      this[timeline].streaming = true
      this.stopFetchingTimeline(timeline, 'Socket connected')
    },
    onStreamDisconnect(timeline, argument) {
      console.debug('[Timelines] Stream disconnected', timeline, argument)
      this[timeline].streaming = false
      this.startFetchingTimeline(timeline, argument, 'Socket disconnected')
    },
    startFetchingTimeline(timelineName, argument, reason) {
      console.debug('[Timelines] Starting fetching timeline', timelineName, argument, 'Reason:', reason)
      const timeline = this[timelineName]
      timeline.fetcher.startFetching()
    },
    stopFetchingTimeline(timelineName, reason) {
      console.debug('[Timelines] Stopped fetching timeline', timelineName, 'Reason:', reason)
      const timeline = this[timelineName]
      timeline.fetcher.stopFetching()
    },

    // Queues & Timeline manip
    updateTimelineExtremes(timeline, statuses, pagination = {}) {
      // Can't use Math.min/max because it doesn't work with string (duh)
      const minNew = pagination.maxId ?? min(...statuses) ?? ''
      const maxNew = pagination.minId ?? max(...statuses) ?? ''

      const newer = maxNew > timeline.maxId
      const older = minNew < timeline.minId

      if (newer || timeline.maxId === '') {
        timeline.maxId = maxNew
      }
      if (older || timeline.minId === '') {
        timeline.minId = minNew
      }
    },
    showNewStatuses(timelineName) {
      const timeline = this[timelineName]

      timeline.newStatusCount = 0

      timeline.visibleStatusesIds = new Set(
        [...timeline.statuses.keys()].slice(0, 50),
      )
      timeline.minVisibleId = last(timeline.visibleStatusesIds.keys())
      timeline.minId = ''
      timeline.maxId = ''

      this.updateTimelineExtremes(timeline, [...timeline.statuses.keys()])
    },
    clearTimeline(timeline) {
    },
    queueFlush(timeline, id) {
      this[timeline].flushMarker = id
    },
    queueFlushAll() {
      Object.keys(this).forEach((timeline) => {
        this[timeline].flushMarker = this[timeline].maxId
      })
    },

    // Misc
    removeUserStatuses({ timelineName, userId }) {
      const timeline = this.timelines[timelineName]

      timeline.statuses
        .values()
        .filter(({ user }) => user.id === userId)
        .forEach(({ id }) => {
          timeline.statuses.delete(id)
          timeline.visibleStatusesIds.delete(id)
        })
      timeline.minVisibleId =
        timeline.visibleStatusesIds.size > 0
          ? last(timeline.visibleStatusesIds).id
          : 0
      timeline.maxId =
        timeline.statuses.length > 0 ? first(timeline.statuses).id : 0
    },
  },
})
