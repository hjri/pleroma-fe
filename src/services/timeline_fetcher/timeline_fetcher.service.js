import { camelCase } from 'lodash'

import { promiseInterval } from '../promise_interval/promise_interval.js'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { fetchTimeline } from 'src/api/public.js'

const update = ({
  store,
  statuses,
  timeline,
  showImmediately,
  userId,
  listId,
  pagination,
}) => {
  const ccTimeline = camelCase(timeline)

  store.dispatch('addNewStatuses', {
    timeline: ccTimeline,
    userId,
    listId,
    statuses,
    showImmediately,
    pagination,
  })
}

const fetchAndUpdate = ({
  store,
  credentials,
  timeline = 'friends',
  older = false,
  showImmediately = false,
  userId,
  listId,
  statusId,
  bookmarkFolderId,
  tag,
  maxId,
  sinceId,
}) => {
  const args = { timeline, credentials }
  const rootState = store.rootState || store.state
  const timelineData = rootState.statuses.timelines[camelCase(timeline)]
  const { hideMutedPosts, replyVisibility } =
    useMergedConfigStore().mergedConfig
  const loggedIn = !!rootState.users.currentUser

  if (older) {
    // When minId = 0 we need to fetch without maxId param
    args.maxId = maxId || timelineData.minId || null
  } else {
    if (sinceId === undefined) {
      args.sinceId = timelineData.maxId
    } else if (sinceId !== null) {
      args.sinceId = sinceId
    }
  }

  args.userId = userId
  args.listId = listId
  args.statusId = statusId
  args.bookmarkFolderId = bookmarkFolderId
  args.tag = tag
  args.withMuted = !hideMutedPosts
  if (
    loggedIn &&
    ['friends', 'public', 'publicAndExternal', 'bubble'].includes(timeline)
  ) {
    args.replyVisibility = replyVisibility
  }

  const numStatusesBeforeFetch = timelineData.statuses.length

  return fetchTimeline(args)
    .then((response) => {
      const { data: statuses, pagination } = response
      if (
        !older &&
        statuses.length >= 20 &&
        !timelineData.loading &&
        numStatusesBeforeFetch > 0
      ) {
        store.dispatch('queueFlush', { timeline, id: timelineData.maxId })
      }
      update({
        store,
        statuses,
        timeline,
        showImmediately,
        userId,
        listId,
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
}

const startFetching = ({
  timeline = 'friends',
  credentials,
  store,
  userId,
  listId,
  statusId,
  bookmarkFolderId,
  tag,
}) => {
  const rootState = store.rootState || store.state
  const timelineData = rootState.statuses.timelines[camelCase(timeline)]
  const showImmediately = timelineData.visibleStatuses.length === 0
  timelineData.userId = userId
  timelineData.listId = listId
  timelineData.bookmarkFolderId = bookmarkFolderId
  fetchAndUpdate({
    timeline,
    credentials,
    store,
    showImmediately,
    userId,
    listId,
    statusId,
    bookmarkFolderId,
    tag,
  })
  const boundFetchAndUpdate = () =>
    fetchAndUpdate({
      timeline,
      credentials,
      store,
      userId,
      listId,
      statusId,
      bookmarkFolderId,
      tag,
    })
  return promiseInterval(boundFetchAndUpdate, 10000)
}
const timelineFetcher = {
  fetchAndUpdate,
  startFetching,
}

export default timelineFetcher
