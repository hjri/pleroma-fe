import { ref } from 'vue'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { ARGUMENT_MAP, useTimelinesStore } from 'src/stores/timelines.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchTimeline } from 'src/api/timelines.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

const REPLY_VISIBILITY_TIMELINES = new Set([
  'friends',
  'public',
  'publicAndExternal',
  'bubble',
])

const timelineFetcher = (timeline, argument, credentials) => {
  const loading = ref(false)
  const bottomedOut = ref(false)
  const interval = ref(null)

  const fetchAndUpdate = ({ older = false, showImmediately = false } = {}) => {
    loading.value = true

    const { hideMutedPosts, replyVisibility } =
      useMergedConfigStore().mergedConfig
    const loggedIn = useUsersStore().loggedIn

    const args = { timeline: timeline.name, credentials }
    const mainArg = ARGUMENT_MAP[timeline.name]
    if (mainArg) args[mainArg] = argument

    if (older) {
      // When minId = 0 we need to fetch without maxId param
      args.maxId = timeline.minId || null
    } else {
      args.sinceId = timeline.maxId || null
    }

    args.withMuted = !hideMutedPosts
    if (loggedIn && REPLY_VISIBILITY_TIMELINES.has(timeline)) {
      args.replyVisibility = replyVisibility
    }

    const numStatusesBeforeFetch = timeline.statusIds.size

    return fetchTimeline(args)
      .then(({ data: statuses, pagination, timestamp }) => {
        if (!older && statuses.length >= 20 && numStatusesBeforeFetch > 0) {
          useTimelinesStore().queueFlush(timeline.name, timeline.maxId)
        }

        if (older && statuses.length === 0) {
          bottomedOut.value = true
        }

        const processed = useStatusesStore()
          .addNewStatuses({ statuses, timestamp })
          .map(({ id }) => id)

        useTimelinesStore().addStatusesToTimeline(timeline.name, argument, {
          statuses: processed,
          showImmediately,
          older,
          pagination,
        })

        return { statuses, pagination }
      })
      .catch((error) => {
        if (error.statusCode === 403 && timeline === 'favorites') {
          useInstanceCapabilitiesStore().pleromaPublicFavouritesAvailable = false
          return
        }
        console.error('Timeline Error', error)
        useInterfaceStore().pushGlobalNotice({
          level: 'error',
          messageKey: 'timeline.error',
          messageArgs: [error.message],
          timeout: 5000,
        })
      })
      .finally(() => {
        loading.value = false
      })
  }

  const startFetching = () => {
    if (interval.value) throw new Error('Interval already exists!')

    fetchAndUpdate({
      showImmediately: timeline.visibleStatusIds.size === 0,
    })

    interval.value = promiseInterval(fetchAndUpdate, 10000)
  }

  const stopFetching = () => {
    interval.value.stop()
    interval.value = null
  }

  return {
    startFetching,
    stopFetching,
    fetchOlder: () => fetchAndUpdate({ showImmediately: true, older: true }),
    loading,
    bottomedOut,
  }
}

export default timelineFetcher
