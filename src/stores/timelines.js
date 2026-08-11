import { first, last, max, min } from 'lodash'
import { defineStore } from 'pinia'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import timelineFetcher from 'src/services/timeline_fetcher/timeline_fetcher.service.js'

const emptyTl = (name, argument = null) => {
  const result = {
    name,
    statuses: new Map(),
    visibleStatusesIds: new Set(),
    newStatusCount: 0,
    maxId: 0,
    minId: 0,
    minVisibleId: 0,
    loading: false,
    flushMarker: 0,
    fetcher: null,
  }

  const property = USER_TIMELINES.has(name) ? 'userId' : ARGUMENT_MAP[name]

  if (property) {
    result[property] = argument
  }

  return result
}

export const ARGUMENT_MAP = {
  tag: 'tag',
  list: 'listId',
  bookmarks: 'bookmarkFolderId',
  quotes: 'statusId',
  search: 'query',
}

export const defaultState = () => {
  return Object.fromEntries([
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
  ].map((name) => [name, emptyTl(name)]))
}

const USER_TIMELINES = new Set(['user', 'userPinned', 'media', 'favorites'])
//const CUSTOM_SORT = new Set(['bookmarks', 'favorites'])

export const useTimelinesStore = defineStore('timelines', {
  state: defaultState,
  actions: {
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
      const property = USER_TIMELINES.has(name) ? 'userId' : ARGUMENT_MAP[name]

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
            this.addStatusesToTimeline('mentions', null, { statuses, nested: true })
          }
        }

        if (status.visibility === 'direct') {
          if (timeline !== this.dms) {
            this.addStatusesToTimeline('dms', null, { statuses, nested: true })
          }
        }
      })
    },

    // Fetchers
    startFetchingTimeline(timelineName, argument) {
      const timeline = this[timelineName]
      if (timeline.fetcher) return

      if (
        timelineName === 'favourites' &&
        !useInstanceCapabilitiesStore().pleromaPublicFavouritesAvailable
      ) {
        return
      }

      timeline.fetcher = timelineFetcher(
        timeline,
        argument,
        ARGUMENT_MAP[timeline.name],
        useOAuthStore().token,
      )

      timeline.fetcher.startFetching()
    },
    stopFetchingTimeline(timelineName) {
      const timeline = this[timelineName]
      timeline.fetcher?.stopFetching()
      timeline.fetcher = null
    },

    // Queues & Timeline manip
    updateTimelineExtremes(timeline, statuses, pagination = {}) {
      // Can't use Math.min/max because it doesn't work with string (duh)
      const minNew = pagination.maxId ?? min(...statuses) ?? ''
      const maxNew = pagination.minId ?? max(...statuses) ?? ''

      const newer = maxNew > timeline.maxId || timeline.maxId === ''
      const older = minNew < timeline.minId || timeline.minId === ''

      if (newer) {
        timeline.maxId = maxNew
      }
      if (older) {
        timeline.minId = minNew
      }
    },
    resetStatuses() {
      const emptyState = defaultState()

      Object.entries(emptyState).forEach(([key, value]) => {
        this[key] = value
      })
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
    clearTimeline(timeline, excludeUserId = false) {
      const userId = excludeUserId ? this[timeline].userId : undefined
      this.stopFetchingTimeline(timeline)
      this[timeline] = emptyTl(timeline, userId)
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
