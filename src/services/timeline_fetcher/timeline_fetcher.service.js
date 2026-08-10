import { camelCase } from 'lodash'

import { promiseInterval } from '../promise_interval/promise_interval.js'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchTimeline } from 'src/api/timelines.js'

const update = ({
  statuses,
  timeline,
  showImmediately,
  userId,
  listId,
  pagination,
}) => {
  const ccTimeline = camelCase(timeline)

  useStatusesStore().addNewStatuses({
    timelineName: ccTimeline,
    userId,
    listId,
    statuses,
    showImmediately,
    pagination,
  })
}

const fetchAndUpdate = ({
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
  const timelineData = useStatusesStore().timelines[camelCase(timeline)]
  const { hideMutedPosts, replyVisibility } =
    useMergedConfigStore().mergedConfig
  const loggedIn = !!useUsersStore().currentUser

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
        useStatusesStore().queueFlush({ timeline, id: timelineData.maxId })
      }
      update({
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
  userId,
  listId,
  statusId,
  bookmarkFolderId,
  tag,
}) => {
  const timelineData = useStatusesStore().timelines[camelCase(timeline)]
  const showImmediately = timelineData.visibleStatuses.size === 0
  console.log(timeline)
  timelineData.userId = userId
  timelineData.listId = listId
  timelineData.bookmarkFolderId = bookmarkFolderId
  fetchAndUpdate({
    timeline,
    credentials,
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
