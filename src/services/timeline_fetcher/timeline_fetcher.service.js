import { camelCase } from 'lodash'

import { promiseInterval } from '../promise_interval/promise_interval.js'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { ARGUMENT_MAP, useTimelinesStore } from 'src/stores/timelines.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchTimeline } from 'src/api/timelines.js'

const REPLY_VISIBILITY_TIMELINES = new Set([
  'friends',
  'public',
  'publicAndExternal',
  'bubble',
])

const fetchAndUpdate = (
  { timeline, argument, credentials },
  { maxId, sinceId, older = false, showImmediately = false },
) => {
  timeline.loading = true
  const { hideMutedPosts, replyVisibility } =
    useMergedConfigStore().mergedConfig
  const loggedIn = useUsersStore().loggedIn

  const args = { timeline: timeline.name, credentials }
  const mainArg = ARGUMENT_MAP[timeline.name]
  if (mainArg) args[mainArg] = argument

  if (older) {
    // When minId = 0 we need to fetch without maxId param
    args.maxId = maxId || timeline.minId || null
  } else {
    if (sinceId === undefined) {
      args.sinceId = timeline.maxId
    } else if (sinceId !== null) {
      args.sinceId = sinceId
    }
  }

  args.withMuted = !hideMutedPosts
  if (loggedIn && REPLY_VISIBILITY_TIMELINES.has(timeline)) {
    args.replyVisibility = replyVisibility
  }

  const numStatusesBeforeFetch = timeline.statuses.size

  return fetchTimeline(args)
    .then((response) => {
      const { data: statuses, pagination, timestamp } = response
      if (
        !older &&
        statuses.length >= 20 &&
        !timeline.loading &&
        numStatusesBeforeFetch > 0
      ) {
        useTimelinesStore().queueFlush(timeline.name, timeline.maxId)
      }

      const processed = useStatusesStore()
        .addNewStatuses({ statuses, timestamp })
        .filter(Boolean)

      useTimelinesStore().addStatusesToTimeline(timeline.name, argument, {
        statuses,
        showImmediately,
        pagination,
      })
      return { statuses, pagination }
    })
    .catch((error) => {
      if (error.statusCode === 403 && timeline === 'favorites') {
        useInstanceCapabilitiesStore().pleromaPublicFavouritesAvailable = false
        return
      }
      useInterfaceStore().pushGlobalNotice({
        level: 'error',
        messageKey: 'timeline.error',
        messageArgs: [error.message],
        timeout: 5000,
      })
    })
    .finally(() => {
      timeline.loading = false
    })
}

const timelineFetcher = (timeline, argument, credentials) => {
  const state = {
    interval: null,
  }

  const boundFetchAndUpdate = ({
    showImmediately,
    maxId,
    sinceId,
    older,
  } = {}) =>
    fetchAndUpdate(
      {
        timeline,
        argument,
        credentials,
      },
      {
        maxId,
        sinceId,
        older,
        showImmediately,
      },
    )

  const startFetching = () => {
    if (state.interval) throw new Error('Interval already exists!')

    boundFetchAndUpdate({
      showImmediately: timeline.visibleStatusesIds.size === 0,
    })

    state.interval = promiseInterval(boundFetchAndUpdate, 10000)
  }

  const stopFetching = () => {
    state.interval.stop()
    state.interval = null
  }

  return {
    startFetching,
    stopFetching,
    fetchAndUpdate: boundFetchAndUpdate,
  }
}

export default timelineFetcher
