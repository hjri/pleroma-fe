import {
  each,
  find,
  findIndex,
  first,
  last,
  maxBy,
  merge,
  minBy,
  omitBy,
  remove,
} from 'lodash'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useOAuthStore } from 'src/stores/oauth.js'

import {
  fetchEmojiReactions,
  fetchFavoritedByUsers,
  fetchPinnedStatuses,
  fetchRebloggedByUsers,
  fetchScrobbles,
  fetchStatus,
  fetchStatusHistory,
  fetchStatusSource,
  search2,
} from 'src/api/public.js'
import {
  bookmarkStatus,
  deleteStatus,
  favorite,
  muteConversation,
  pinOwnStatus,
  reactWithEmoji,
  retweet,
  unbookmarkStatus,
  unfavorite,
  unmuteConversation,
  unpinOwnStatus,
  unreactWithEmoji,
  unretweet,
} from 'src/api/user.js'

const emptyTl = (userId = 0) => ({
  statuses: [],
  statusesObject: {},
  faves: [],
  visibleStatuses: [],
  visibleStatusesObject: {},
  newStatusCount: 0,
  maxId: '',
  minId: '',
  minVisibleId: 0,
  loading: false,
  followers: [],
  friends: [],
  userId,
  flushMarker: 0,
})

export const defaultState = () => ({
  allStatuses: [],
  scrobblesNextFetch: {},
  allStatusesObject: {},
  conversationsObject: {},
  maxId: '',
  favorites: new Set(),
  timelines: {
    mentions: emptyTl(),
    public: emptyTl(),
    user: emptyTl(),
    favorites: emptyTl(),
    media: emptyTl(),
    publicAndExternal: emptyTl(),
    friends: emptyTl(),
    tag: emptyTl(),
    dms: emptyTl(),
    bookmarks: emptyTl(),
    list: emptyTl(),
    bubble: emptyTl(),
  },
})

export const prepareStatus = (status) => {
  // Set deleted flag
  status.deleted = false

  // To make the array reactive
  status.attachments = status.attachments || []

  return status
}

const mergeOrAdd = (arr, obj, item) => {
  const oldItem = obj[item.id]

  if (oldItem) {
    // We already have this, so only merge the new info.
    // We ignore null values to avoid overwriting existing properties with missing data
    // we also skip 'user' because that is handled by users module
    merge(
      oldItem,
      omitBy(item, (v, k) => v === null || k === 'user'),
    )
    // Reactivity fix.
    oldItem.attachments.splice(oldItem.attachments.length)
    return { item: oldItem, new: false }
  } else {
    // This is a new item, prepare it
    prepareStatus(item)
    arr.push(item)
    obj[item.id] = item
    return { item, new: true }
  }
}

const sortById = (a, b) => {
  const seqA = Number(a.id)
  const seqB = Number(b.id)
  const isSeqA = !Number.isNaN(seqA)
  const isSeqB = !Number.isNaN(seqB)
  if (isSeqA && isSeqB) {
    return seqA > seqB ? -1 : 1
  } else if (isSeqA && !isSeqB) {
    return 1
  } else if (!isSeqA && isSeqB) {
    return -1
  } else {
    return a.id > b.id ? -1 : 1
  }
}

const sortTimeline = (timeline) => {
  timeline.visibleStatuses = timeline.visibleStatuses.sort(sortById)
  timeline.statuses = timeline.statuses.sort(sortById)
  timeline.minVisibleId = last(timeline.visibleStatuses)?.id
  return timeline
}

const getLatestScrobble = (state, user) => {
  const scrobblesSupport =
    useInstanceCapabilitiesStore().pleromaScrobblesAvailable

  if (!scrobblesSupport || !user.name || user.id === 'undefined') {
    return
  }

  if (
    state.scrobblesNextFetch[user.id] &&
    state.scrobblesNextFetch[user.id] > Date.now()
  ) {
    return
  }

  state.scrobblesNextFetch[user.id] = Date.now() + 24 * 60 * 60 * 1000
  if (!scrobblesSupport) return
  fetchScrobbles({ accountId: user.id })
    .then(({ data: scrobbles }) => {
      if (scrobbles?.error) {
        useInstanceCapabilitiesStore().set('pleromaScrobblesAvailable', false)
        return
      }

      if (scrobbles.length > 0) {
        user.latestScrobble = scrobbles[0]

        state.scrobblesNextFetch[user.id] = Date.now() + 60 * 1000
      }
    })
    .catch((e) => {
      console.warn('cannot fetch scrobbles', e)
    })
}

// Add status to the global storages (arrays and objects maintaining statuses) except timelines
const addStatusToGlobalStorage = (state, data) => {
  getLatestScrobble(state, data.user)
  const result = mergeOrAdd(state.allStatuses, state.allStatusesObject, data)
  if (result.new) {
    // Add to conversation
    const status = result.item
    const conversationsObject = state.conversationsObject
    const conversationId = status.statusnet_conversation_id
    if (conversationsObject[conversationId]) {
      conversationsObject[conversationId].push(status)
    } else {
      conversationsObject[conversationId] = [status]
    }
  }
  return result
}

const addNewStatuses = (
  state,
  {
    statuses,
    showImmediately = false,
    timeline,
    user = {},
    noIdUpdate = false,
    userId,
    pagination = {},
  },
) => {
  // Sanity check
  if (!Array.isArray(statuses)) {
    return false
  }

  const allStatuses = state.allStatuses
  const timelineObject = state.timelines[timeline]

  // Mismatch between API pagination and our internal minId/maxId tracking systems:
  // pagination.maxId is the oldest of the returned statuses when fetching older,
  // and pagination.minId is the newest when fetching newer. The names come directly
  // from the arguments they're supposed to be passed as for the next fetch.
  const minNew =
    pagination.maxId || (statuses.length > 0 ? minBy(statuses, 'id').id : 0)
  const maxNew =
    pagination.minId || (statuses.length > 0 ? maxBy(statuses, 'id').id : 0)

  const newer =
    timeline &&
    (maxNew > timelineObject.maxId || timelineObject.maxId === '') &&
    statuses.length > 0
  const older =
    timeline &&
    (minNew < timelineObject.minId || timelineObject.minId === '') &&
    statuses.length > 0

  if (!noIdUpdate && newer) {
    timelineObject.maxId = maxNew
  }
  if (!noIdUpdate && older) {
    timelineObject.minId = minNew
  }

  // This makes sure that user timeline won't get data meant for other
  // user. I.e. opening different user profiles makes request which could
  // return data late after user already viewing different user profile
  if (
    (timeline === 'user' || timeline === 'media') &&
    timelineObject.userId !== userId
  ) {
    return
  }

  const addStatus = (data, showImmediately, addToTimeline = true) => {
    const result = addStatusToGlobalStorage(state, data)
    const status = result.item

    if (result.new) {
      // We are mentioned in a post
      if (
        status.type === 'status' &&
        find(status.attentions, { id: user.id })
      ) {
        const mentions = state.timelines.mentions

        // Add the mention to the mentions timeline
        if (timelineObject !== mentions) {
          mergeOrAdd(mentions.statuses, mentions.statusesObject, status)
          mentions.newStatusCount += 1

          sortTimeline(mentions)
        }
      }
      if (status.visibility === 'direct') {
        const dms = state.timelines.dms

        mergeOrAdd(dms.statuses, dms.statusesObject, status)
        dms.newStatusCount += 1

        sortTimeline(dms)
      }
    }

    // Decide if we should treat the status as new for this timeline.
    let resultForCurrentTimeline
    // Some statuses should only be added to the global status repository.
    if (timeline && addToTimeline) {
      resultForCurrentTimeline = mergeOrAdd(
        timelineObject.statuses,
        timelineObject.statusesObject,
        status,
      )
    }

    if (timeline && showImmediately) {
      // Add it directly to the visibleStatuses, don't change
      // newStatusCount
      mergeOrAdd(
        timelineObject.visibleStatuses,
        timelineObject.visibleStatusesObject,
        status,
      )
    } else if (timeline && addToTimeline && resultForCurrentTimeline.new) {
      // Just change newStatuscount
      timelineObject.newStatusCount += 1
    }

    if (status.quote) {
      addStatus(
        status.quote,
        /* showImmediately = */ false,
        /* addToTimeline = */ false,
      )
    }

    return status
  }

  const favoriteStatus = (favorite) => {
    const status = find(allStatuses, { id: favorite.in_reply_to_status_id })
    if (status) {
      // This is our favorite, so the relevant bit.
      if (favorite.user.id === user.id) {
        status.favorited = true
      } else {
        status.fave_num += 1
      }
    }
    return status
  }

  const processors = {
    status: (status) => {
      addStatus(status, showImmediately)
    },
    edit: (status) => {
      addStatus(status, showImmediately)
    },
    retweet: (status) => {
      // RetweetedStatuses are never shown immediately
      const retweetedStatus = addStatus(status.retweeted_status, false, false)

      let retweet
      // If the retweeted status is already there, don't add the retweet
      // to the timeline.
      if (
        timeline &&
        find(timelineObject.statuses, (s) => {
          if (s.retweeted_status) {
            return (
              s.id === retweetedStatus.id ||
              s.retweeted_status.id === retweetedStatus.id
            )
          } else {
            return s.id === retweetedStatus.id
          }
        })
      ) {
        // Already have it visible (either as the original or another RT), don't add to timeline, don't show.
        retweet = addStatus(status, false, false)
      } else {
        retweet = addStatus(status, showImmediately)
      }

      retweet.retweeted_status = retweetedStatus
    },
    favorite: (favorite) => {
      // Only update if this is a new favorite.
      // Ignore our own favorites because we get info about likes as response to like request
      if (!state.favorites.has(favorite.id)) {
        state.favorites.add(favorite.id)
        favoriteStatus(favorite)
      }
    },
    follow: () => {
      // NOOP, it is known status but we don't do anything about it for now
    },
    default: (unknown) => {
      console.warn('unknown status type', unknown)
    },
  }

  each(statuses, (status) => {
    const type = status.type
    const processor = processors[type] || processors.default
    processor(status)
  })

  // Keep the visible statuses sorted
  if (timeline && !(timeline === 'bookmarks')) {
    sortTimeline(timelineObject)
  }
}

const removeStatus = (state, { timeline, userId }) => {
  const timelineObject = state.timelines[timeline]
  if (userId) {
    remove(timelineObject.statuses, { user: { id: userId } })
    remove(timelineObject.visibleStatuses, { user: { id: userId } })
    timelineObject.minVisibleId =
      timelineObject.visibleStatuses.length > 0
        ? last(timelineObject.visibleStatuses).id
        : 0
    timelineObject.maxId =
      timelineObject.statuses.length > 0 ? first(timelineObject.statuses).id : 0
  }
}

export const mutations = {
  addNewStatuses,
  removeStatus,
  showNewStatuses(state, { timeline }) {
    const oldTimeline = state.timelines[timeline]

    oldTimeline.newStatusCount = 0
    oldTimeline.visibleStatuses = oldTimeline.statuses.slice(0, 50)
    oldTimeline.minVisibleId = last(oldTimeline.visibleStatuses).id
    oldTimeline.minId = oldTimeline.minVisibleId
    oldTimeline.visibleStatusesObject = {}
    each(oldTimeline.visibleStatuses, (status) => {
      oldTimeline.visibleStatusesObject[status.id] = status
    })
  },
  resetStatuses(state) {
    const emptyState = defaultState()
    Object.entries(emptyState).forEach(([key, value]) => {
      state[key] = value
    })
  },
  clearTimeline(state, { timeline, excludeUserId = false }) {
    const userId = excludeUserId ? state.timelines[timeline].userId : undefined
    state.timelines[timeline] = emptyTl(userId)
  },
  setFavorited(state, { status, value }) {
    const newStatus = state.allStatusesObject[status.id]

    if (newStatus.favorited !== value) {
      if (value) {
        newStatus.fave_num++
      } else {
        newStatus.fave_num--
      }
    }

    newStatus.favorited = value
  },
  setFavoritedConfirm(state, { status, user }) {
    const newStatus = state.allStatusesObject[status.id]
    newStatus.favorited = status.favorited
    newStatus.fave_num = status.fave_num
    const index = findIndex(newStatus.favoritedBy, { id: user.id })
    if (index !== -1 && !newStatus.favorited) {
      newStatus.favoritedBy.splice(index, 1)
    } else if (index === -1 && newStatus.favorited) {
      newStatus.favoritedBy.push(user)
    }
  },
  setMutedStatus(state, status) {
    const newStatus = state.allStatusesObject[status.id]
    newStatus.thread_muted = status.thread_muted

    if (newStatus.thread_muted !== undefined) {
      state.conversationsObject[newStatus.statusnet_conversation_id].forEach(
        (status) => {
          status.thread_muted = newStatus.thread_muted
        },
      )
    }
  },
  setRetweeted(state, { status, value }) {
    const newStatus = state.allStatusesObject[status.id]

    if (newStatus.repeated !== value) {
      if (value) {
        newStatus.repeat_num++
      } else {
        newStatus.repeat_num--
      }
    }

    newStatus.repeated = value
  },
  setRetweetedConfirm(state, { status, user }) {
    const newStatus = state.allStatusesObject[status.id]
    newStatus.repeated = status.repeated
    newStatus.repeat_num = status.repeat_num
    const index = findIndex(newStatus.rebloggedBy, { id: user.id })
    if (index !== -1 && !newStatus.repeated) {
      newStatus.rebloggedBy.splice(index, 1)
    } else if (index === -1 && newStatus.repeated) {
      newStatus.rebloggedBy.push(user)
    }
  },
  setBookmarked(state, { status, value }) {
    const newStatus = state.allStatusesObject[status.id]
    newStatus.bookmarked = value
    newStatus.bookmark_folder_id = status.bookmark_folder_id
  },
  setBookmarkedConfirm(state, { status }) {
    const newStatus = state.allStatusesObject[status.id]
    newStatus.bookmarked = status.bookmarked
    if (status.pleroma)
      newStatus.bookmark_folder_id = status.pleroma.bookmark_folder
  },
  setDeleted(state, { status }) {
    const newStatus = state.allStatusesObject[status.id]
    if (newStatus) newStatus.deleted = true
  },
  setManyDeleted(state, condition) {
    Object.values(state.allStatusesObject).forEach((status) => {
      if (condition(status)) {
        status.deleted = true
      }
    })
  },
  setLoading(state, { timeline, value }) {
    state.timelines[timeline].loading = value
  },
  setNsfw(state, { id, nsfw }) {
    const newStatus = state.allStatusesObject[id]
    newStatus.nsfw = nsfw
  },
  queueFlush(state, { timeline, id }) {
    state.timelines[timeline].flushMarker = id
  },
  queueFlushAll(state) {
    Object.keys(state.timelines).forEach((timeline) => {
      state.timelines[timeline].flushMarker = state.timelines[timeline].maxId
    })
  },
  addRepeats(state, { id, rebloggedByUsers, currentUser }) {
    const newStatus = state.allStatusesObject[id]
    newStatus.rebloggedBy = rebloggedByUsers.filter(Boolean)
    // repeats stats can be incorrect based on polling condition, let's update them using the most recent data
    newStatus.repeat_num = newStatus.rebloggedBy.length
    newStatus.repeated = !!newStatus.rebloggedBy.find(
      ({ id }) => currentUser.id === id,
    )
  },
  addFavs(state, { id, favoritedByUsers, currentUser }) {
    const newStatus = state.allStatusesObject[id]
    newStatus.favoritedBy = favoritedByUsers.filter(Boolean)
    // favorites stats can be incorrect based on polling condition, let's update them using the most recent data
    newStatus.fave_num = newStatus.favoritedBy.length
    newStatus.favorited = !!newStatus.favoritedBy.find(
      ({ id }) => currentUser.id === id,
    )
  },
  addEmojiReactionsBy(state, { id, emojiReactions }) {
    const status = state.allStatusesObject[id]
    status.emoji_reactions = emojiReactions
  },
  addOwnReaction(state, { id, emoji, currentUser }) {
    const status = state.allStatusesObject[id]
    const reactionIndex = findIndex(status.emoji_reactions, { name: emoji })
    const reaction = status.emoji_reactions[reactionIndex] || {
      name: emoji,
      count: 0,
      accounts: [],
    }

    const newReaction = {
      ...reaction,
      count: reaction.count + 1,
      me: true,
      accounts: [...reaction.accounts, currentUser],
    }

    // Update count of existing reaction if it exists, otherwise append at the end
    if (reactionIndex >= 0) {
      status.emoji_reactions[reactionIndex] = newReaction
    } else {
      status.emoji_reactions = [...status.emoji_reactions, newReaction]
    }
  },
  removeOwnReaction(state, { id, emoji, currentUser }) {
    const status = state.allStatusesObject[id]
    const reactionIndex = findIndex(status.emoji_reactions, { name: emoji })
    if (reactionIndex < 0) return

    const reaction = status.emoji_reactions[reactionIndex]
    const accounts = reaction.accounts || []

    const newReaction = {
      ...reaction,
      count: reaction.count - 1,
      me: false,
      accounts: accounts.filter((acc) => acc.id !== currentUser.id),
    }

    if (newReaction.count > 0) {
      status.emoji_reactions[reactionIndex] = newReaction
    } else {
      status.emoji_reactions = status.emoji_reactions.filter(
        (r) => r.name !== emoji,
      )
    }
  },
  updateStatusWithPoll(state, { id, poll }) {
    const status = state.allStatusesObject[id]
    status.poll = poll
  },
  setVirtualHeight(state, { statusId, height }) {
    state.allStatusesObject[statusId].virtualHeight = height
  },
}

const statuses = {
  state: defaultState(),
  actions: {
    addNewStatuses(
      { rootState, commit },
      {
        statuses,
        showImmediately = false,
        timeline = false,
        noIdUpdate = false,
        userId,
        pagination,
      },
    ) {
      return commit('addNewStatuses', {
        statuses,
        showImmediately,
        timeline,
        noIdUpdate,
        user: rootState.users.currentUser,
        userId,
        pagination,
      })
    },
    fetchStatus({ rootState, dispatch }, id) {
      return fetchStatus({ id }).then(({ data: status }) =>
        dispatch('addNewStatuses', { statuses: [status] }),
      )
    },
    fetchStatusSource({ rootState }, status) {
      return fetchStatusSource({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data }) => data)
    },
    fetchStatusHistory(_, status) {
      return fetchStatusHistory({ status }).then(({ data }) => data)
    },
    deleteStatus({ rootState, commit }, status) {
      deleteStatus({
        id: status.id,
        credentials: useOAuthStore().token,
      })
        .then(() => {
          commit('setDeleted', { status })
        })
        .catch((e) => {
          useInterfaceStore().pushGlobalNotice({
            level: 'error',
            messageKey: 'status.delete_error',
            messageArgs: [e.message],
            timeout: 5000,
          })
        })
    },
    deleteStatusById({ rootState, commit }, id) {
      const status = rootState.statuses.allStatusesObject[id]
      commit('setDeleted', { status })
    },
    markStatusesAsDeleted({ commit }, condition) {
      commit('setManyDeleted', condition)
    },
    favorite({ rootState, commit }, status) {
      // Optimistic favoriting...
      commit('setFavorited', { status, value: true })
      favorite({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        commit('setFavoritedConfirm', {
          status,
          user: rootState.users.currentUser,
        }),
      )
    },
    unfavorite({ rootState, commit }, status) {
      // Optimistic unfavoriting...
      commit('setFavorited', { status, value: false })
      unfavorite({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        commit('setFavoritedConfirm', {
          status,
          user: rootState.users.currentUser,
        }),
      )
    },
    fetchPinnedStatuses({ rootState, dispatch }, userId) {
      fetchPinnedStatuses({
        id: userId,
        credentials: useOAuthStore().token,
      }).then(({ data: statuses }) =>
        dispatch('addNewStatuses', {
          statuses,
          timeline: 'user',
          userId,
          showImmediately: true,
          noIdUpdate: true,
        }),
      )
    },
    pinStatus({ rootState, dispatch }, statusId) {
      return pinOwnStatus({
        id: statusId,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        dispatch('addNewStatuses', { statuses: [status] }),
      )
    },
    unpinStatus({ rootState, dispatch }, statusId) {
      return unpinOwnStatus({
        id: statusId,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        dispatch('addNewStatuses', { statuses: [status] }),
      )
    },
    muteConversation({ rootState, commit }, { id: statusId }) {
      return muteConversation({
        id: statusId,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => commit('setMutedStatus', status))
    },
    unmuteConversation({ rootState, commit }, { id: statusId }) {
      return unmuteConversation({
        id: statusId,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => commit('setMutedStatus', status))
    },
    retweet({ rootState, commit }, status) {
      // Optimistic retweeting...
      commit('setRetweeted', { status, value: true })
      retweet({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        commit('setRetweetedConfirm', {
          status: status.retweeted_status,
          user: rootState.users.currentUser,
        }),
      )
    },
    unretweet({ rootState, commit }, status) {
      // Optimistic unretweeting...
      commit('setRetweeted', { status, value: false })
      unretweet({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) =>
        commit('setRetweetedConfirm', {
          status,
          user: rootState.users.currentUser,
        }),
      )
    },
    bookmark({ rootState, commit }, status) {
      commit('setBookmarked', { status, value: true })
      bookmarkStatus({
        id: status.id,
        folder_id: status.bookmark_folder_id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => {
        commit('setBookmarkedConfirm', { status })
      })
    },
    unbookmark({ rootState, commit }, status) {
      commit('setBookmarked', { status, value: false })
      unbookmarkStatus({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status }) => {
        commit('setBookmarkedConfirm', { status })
      })
    },
    queueFlush({ commit }, { timeline, id }) {
      commit('queueFlush', { timeline, id })
    },
    queueFlushAll({ commit }) {
      commit('queueFlushAll')
    },
    fetchFavsAndRepeats({ rootState, commit }, id) {
      Promise.all([
        fetchFavoritedByUsers({
          id,
          credentials: useOAuthStore().token,
        }).then(({ data }) => data),
        fetchRebloggedByUsers({
          id,
          credentials: useOAuthStore().token,
        }).then(({ data }) => data),
      ]).then(([favoritedByUsers, rebloggedByUsers]) => {
        commit('addFavs', {
          id,
          favoritedByUsers,
          currentUser: rootState.users.currentUser,
        })
        commit('addRepeats', {
          id,
          rebloggedByUsers,
          currentUser: rootState.users.currentUser,
        })
      })
    },
    reactWithEmoji({ rootState, dispatch, commit }, { id, emoji }) {
      const currentUser = rootState.users.currentUser
      if (!currentUser) return

      commit('addOwnReaction', { id, emoji, currentUser })
      reactWithEmoji({
        id,
        emoji,
        credentials: useOAuthStore().token,
      }).then(() => {
        dispatch('fetchEmojiReactionsBy', id)
      })
    },
    unreactWithEmoji({ rootState, dispatch, commit }, { id, emoji }) {
      const currentUser = rootState.users.currentUser
      if (!currentUser) return

      commit('removeOwnReaction', { id, emoji, currentUser })
      unreactWithEmoji({
        id,
        emoji,
        currentUser: rootState.users.currentUser,
      }).then(() => {
        dispatch('fetchEmojiReactionsBy', id)
      })
    },
    fetchEmojiReactionsBy({ rootState, commit }, id) {
      return fetchEmojiReactions({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: emojiReactions }) => {
        commit('addEmojiReactionsBy', {
          id,
          emojiReactions,
          currentUser: rootState.users.currentUser,
        })
      })
    },
    fetchFavs({ rootState, commit }, id) {
      fetchFavoritedByUsers({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: favoritedByUsers }) =>
        commit('addFavs', {
          id,
          favoritedByUsers,
          currentUser: rootState.users.currentUser,
        }),
      )
    },
    fetchRepeats({ rootState, commit }, id) {
      fetchRebloggedByUsers({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: rebloggedByUsers }) =>
        commit('addRepeats', {
          id,
          rebloggedByUsers,
          currentUser: rootState.users.currentUser,
        }),
      )
    },
    search(store, { q, resolve, limit, offset, following, type }) {
      return search2({
        q,
        resolve,
        limit,
        offset,
        following,
        type,
        credentials: useOAuthStore().token,
      }).then(({ data }) => {
        store.commit('addNewUsers', data.accounts)
        store.commit(
          'addNewUsers',
          data.statuses.map((s) => s.user).filter(Boolean),
        )
        store.dispatch('addNewStatuses', {
          statuses: data.statuses,
        })

        data.statuses = data.statuses.map(
          (s) => store.state.allStatusesObject[s.id],
        )
        return data
      })
    },
    setVirtualHeight({ commit }, { statusId, height }) {
      commit('setVirtualHeight', { statusId, height })
    },
  },
  mutations,
}

export default statuses
