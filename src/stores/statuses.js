import { first, last, maxBy, minBy } from 'lodash'
import { defineStore } from 'pinia'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

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

const emptyTl = (userId) => ({
  statuses: new Map(),
  faves: [],
  visibleStatuses: new Map(),
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
  allStatuses: new Map(),
  timestamps: new WeakMap(),
  scrobblesNextFetch: {},
  conversations: new Map(),
  favorites: new Set(),
  timelines: {
    mentions: emptyTl(),
    public: emptyTl(),
    user: emptyTl(),
    userPinned: emptyTl(),
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

const getLatestScrobble = (user) => {
  const scrobblesSupport =
    useInstanceCapabilitiesStore().pleromaScrobblesAvailable

  if (!scrobblesSupport || !user.name || user.id === 'undefined') {
    return
  }

  if (
    this.scrobblesNextFetch[user.id] &&
    this.scrobblesNextFetch[user.id] > Date.now()
  ) {
    return
  }

  this.scrobblesNextFetch[user.id] = Date.now() + 24 * 60 * 60 * 1000
  if (!scrobblesSupport) return
  fetchScrobbles({ accountId: user.id })
    .then(({ data: scrobbles }) => {
      if (scrobbles?.error) {
        useInstanceCapabilitiesStore().set('pleromaScrobblesAvailable', false)
        return
      }

      if (scrobbles.length > 0) {
        user.latestScrobble = scrobbles[0]

        this.scrobblesNextFetch[user.id] = Date.now() + 60 * 1000
      }
    })
    .catch((e) => {
      console.warn('cannot fetch scrobbles', e)
    })
}

const USER_TIMELINES = new Set(['user', 'userPinned', 'media'])

export const useStatusesStore = defineStore('statuses', {
  state: defaultState,
  actions: {
    addNewStatuses({
      statuses,
      showImmediately = false,
      timelineName,
      user = {},
      userId,
      noIdUpdate = false,
      pagination = {},
      timestamp,
    }) {
      // Sanity check
      if (!Array.isArray(statuses)) {
        return false
      }

      const timeline = this.timelines[timelineName]

      if (timeline && !noIdUpdate && statuses.length > 0) {
        this.updateTimelineExtremes(timeline, statuses, pagination)
      }

      // This makes sure that user timeline won't get data meant for other
      // user. I.e. opening different user profiles makes request which could
      // return data late after user already viewing different user profile
      if (USER_TIMELINES.has(timelineName) && timeline.userId !== userId) {
        return
      }

      const addStatus = (data, showImmediately, addToTimeline = true) => {
        getLatestScrobble(data.user)

        const [status] = this.mergeOrAdd(this.allStatuses, data)

        // Add to conversation
        const conversations = this.conversations
        const conversationId = status.statusnet_conversation_id

        if (conversations.has(conversationId)) {
          conversations.get(conversationId).set(status.id, status)
        } else {
          conversations.set(conversationId, new Map([[status.id, status]]))
        }

        // We are mentioned in a post
        if (
          status.type === 'status' &&
          status.attentions.some(({ id }) => id === user.id)
        ) {
          const mentions = this.timelines.mentions

          // Add the mention to the mentions timeline
          if (timeline !== mentions) {
            const [, isNew] = this.mergeOrAdd(mentions.statuses, data)
            if (isNew) mentions.newStatusCount += 1
          }
        }

        if (status.visibility === 'direct') {
          const dms = this.timelines.dms

          const [, isNew] = this.mergeOrAdd(dms.statuses, data)
          if (isNew) dms.newStatusCount += 1
        }

        // Some statuses should only be added to the global status repository.
        if (timeline && addToTimeline) {
          // Decide if we should treat the status as new for this timeline.
          const [status, isNew] = this.mergeOrAdd(timeline.statuses, data)
          if (isNew) {
            if (showImmediately) {
              // Add it directly to the visibleStatuses, don't change
              // newStatusCount
              timeline.visibleStatuses.set(status.id, status)
            } else {
              // Just change newStatuscount
              timeline.newStatusCount += 1
            }
          }
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

      const processors = {
        status: (status) => {
          addStatus(status, showImmediately)
        },
        edit: (status) => {
          addStatus(status, showImmediately)
        },
        retweet: (status) => {
          // RetweetedStatuses are never shown immediately
          const retweetedStatus = addStatus(
            status.retweeted_status,
            false,
            false,
          )

          let retweet
          // If the retweeted status is already there, don't add the retweet
          // to the timeline.
          if (
            [...(timeline?.statuses.values() ?? [])].some((s) => {
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
          if (!this.favorites.has(favorite.id)) {
            this.favorites.add(favorite.id)

            const status = this.allStatuses.get(favorite.in_reply_to_status_id)

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
        },
        follow: () => {
          // NOOP, it is known status but we don't do anything about it for now
        },
        default: (unknown) => {
          console.warn('unknown status type', unknown)
        },
      }

      statuses.forEach((status) => {
        const type = status.type
        const processor = processors[type] ?? processors.default
        processor(status)
      })
    },
    mergeOrAdd(map, status, timestamp) {
      const existing = map.get(status.id) ?? {}
      const oldTimestamp = this.timestamps.get(existing)

      const { user: unused0, ...old } = existing
      const { user: statusUser, ...neu } = status

      const [user] = useUsersStore().addNewUsers({
        data: statusUser,
        timestamp,
      })

      existing.user = user // reactive update in case we return old

      // implicit: if oldTimestamp is undefined this will still be false
      if (oldTimestamp > timestamp) return [existing, false] // not overwriting old data with new

      const newStatus = {
        ...old,
        ...neu,
        user,
      }

      map.set(newStatus.id, newStatus)

      this.timestamps.set(newStatus, timestamp)

      return [map.get(newStatus.id), true]
    },
    fetchStatus(id) {
      return fetchStatus({ id }).then(({ data: status, timestamp }) =>
        this.addNewStatuses({ statuses: [status], timestamp }),
      )
    },
    fetchPinnedStatuses(userId) {
      return fetchPinnedStatuses({
        id: userId,
        credentials: useOAuthStore().token,
      }).then(({ data: statuses, timestamp }) =>
        this.addNewStatuses({
          statuses,
          timeline: 'userPinned',
          userId,
          showImmediately: true,
          noIdUpdate: true,
          timestamp,
        }),
      )
    },
    fetchStatusSource(id) {
      return fetchStatusSource({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data }) => data)
    },
    fetchStatusHistory(status) {
      return fetchStatusHistory({ status }).then(({ data }) => data)
    },
    fetchEmojiReactionsBy(id) {
      return fetchEmojiReactions({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: emojiReactions }) => {
        this.addEmojiReactionsBy({
          id,
          emojiReactions,
        })
      })
    },
    fetchFavs(id) {
      return fetchFavoritedByUsers({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: favoritedByUsers }) =>
        this.addFavs({
          id,
          favoritedByUsers,
        }),
      )
    },
    fetchRepeats(id) {
      return fetchRebloggedByUsers({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: rebloggedByUsers }) =>
        this.addRepeats({
          id,
          rebloggedByUsers,
        }),
      )
    },
    fetchFavsAndRepeats(id) {
      return Promise.all([this.fetchFavs(id), this.fetchRepeats(id)])
    },

    // Updates
    addRepeats({ id, rebloggedByUsers }) {
      const currentUser = useUsersStore().currentUser
      const newStatus = this.allStatuses.get(id)
      newStatus.rebloggedBy = rebloggedByUsers.filter(Boolean)
      // repeats stats can be incorrect based on polling condition, let's update them using the most recent data
      newStatus.repeat_num = newStatus.rebloggedBy.length
      newStatus.repeated = !!newStatus.rebloggedBy.find(
        ({ id }) => currentUser.id === id,
      )
    },
    addFavs({ id, favoritedByUsers }) {
      const currentUser = useUsersStore().currentUser
      const newStatus = this.allStatuses.get(id)
      newStatus.favoritedBy = favoritedByUsers.filter(Boolean)
      // favorites stats can be incorrect based on polling condition, let's update them using the most recent data
      newStatus.fave_num = newStatus.favoritedBy.length
      newStatus.favorited = !!newStatus.favoritedBy.find(
        ({ id }) => currentUser.id === id,
      )
    },
    addEmojiReactionsBy({ id, emojiReactions }) {
      const status = this.allStatuses.get(id)
      status.emoji_reactions = emojiReactions
    },

    // Queues & Timeline manip
    updateTimelineExtremes(timeline, statuses, pagination = {}) {
      // Can't use Math.min/max because it doesn't work with string (duh)
      const minNew = pagination.maxId ?? minBy(statuses, 'id').id ?? ''
      const maxNew = pagination.minId ?? maxBy(statuses, 'id').id ?? ''

      const newer = maxNew > timeline.maxId || timeline.maxId === ''
      const older = minNew < timeline.minId || timeline.minId === ''

      if (newer) {
        timeline.maxId = maxNew
      }
      if (older) {
        timeline.minId = minNew
      }
    },
    showNewStatuses(timelineName) {
      const timeline = this.timelines[timelineName]

      timeline.newStatusCount = 0

      timeline.visibleStatuses = new Map(
        [...timeline.statuses.entries()].slice(0, 50),
      )
      timeline.minVisibleId = last(timeline.visibleStatuses.keys())
      timeline.minId = ''
      timeline.maxId = ''
      this.updateTimelineExtremes(timeline, [...timeline.statuses.values()])
    },
    resetStatuses() {
      const emptyState = defaultState()

      Object.entries(emptyState).forEach(([key, value]) => {
        this[key] = value
      })
    },
    clearTimeline({ timeline, excludeUserId = false }) {
      const userId = excludeUserId ? this.timelines[timeline].userId : undefined
      this.timelines[timeline] = emptyTl(userId)
    },
    queueFlush({ timeline, id }) {
      this.timelines[timeline].flushMarker = id
    },
    queueFlushAll() {
      Object.keys(this.timelines).forEach((timeline) => {
        this.timelines[timeline].flushMarker = this.timelines[timeline].maxId
      })
    },

    // Actions
    /// Favorite
    favorite(id) {
      this.setFavorited({ id, value: true })

      favorite({
        id: status.id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    unfavorite(id) {
      this.setFavorited({ id, value: false })

      unfavorite({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    setFavorited({ id, value }) {
      const newStatus = this.allStatuses.get(id)

      if (newStatus.favorited !== value) {
        if (value) {
          newStatus.fave_num++
        } else {
          newStatus.fave_num--
        }
      }

      newStatus.favorited = value
    },

    /// Reprööt
    retweet(id) {
      this.setRetweeted({ id, value: true })

      retweet({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    unretweet(id) {
      this.setRetweeted({ id, value: false })

      unretweet({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    setRetweeted({ statusId, value }) {
      const newStatus = this.allStatuses.get(statusId)

      if (newStatus.repeated !== value) {
        if (value) {
          newStatus.repeat_num++
        } else {
          newStatus.repeat_num--
        }
      }

      newStatus.repeated = value
    },

    // React
    reactWithEmoji(id, emoji) {
      this.addOwnReaction({ id, emoji })

      reactWithEmoji({
        id,
        emoji,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    unreactWithEmoji(id, emoji) {
      this.removeOwnReaction({ id, emoji })

      unreactWithEmoji({
        id,
        emoji,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    addOwnReaction(id, emoji) {
      const currentUser = useUsersStore().currentUser
      const status = this.allStatuses.get(id)
      const reactionIndex = status.emoji_reactions.findIndex(
        (react) => react.name === emoji,
      )
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
        status.emoji_reactions.push(newReaction)
      }
    },
    removeOwnReaction(id, emoji) {
      const currentUser = useUsersStore().currentUser
      const status = this.allStatuses.get(id)
      const reactionIndex = status.emoji_reactions.findIndex(
        (react) => react.name === emoji,
      )
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

    /// Bookmark
    bookmark(id, bookmark_folder_id) {
      this.setBookmarked({ id, value: true, bookmark_folder_id })

      bookmarkStatus({
        id,
        folder_id: bookmark_folder_id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    unbookmark(id) {
      this.setBookmarked({ id, value: false })

      unbookmarkStatus({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    setBookmarked({ id, value, bookmark_folder_id }) {
      const status = this.allStatuses.get(id)
      status.bookmarked = value
      status.bookmark_folder_id = value ? bookmark_folder_id : null
    },

    /// Mute
    muteConversation(id) {
      return muteConversation({
        id,
        credentials: useOAuthStore().token,
      })
        .then(({ data: status, timestamp }) => {
          this.addNewStatuses({
            statuses: [status],
            timestamp,
          })
          return status
        })
        .then((status) => this.setMutedStatus(status))
    },
    unmuteConversation(id) {
      return unmuteConversation({
        id,
        credentials: useOAuthStore().token,
      })
        .then(({ data: status, timestamp }) => {
          this.addNewStatuses({
            statuses: [status],
            timestamp,
          })
          return status
        })
        .then((status) => this.setMutedStatus(status))
    },
    setMutedStatus({ id, thread_muted }) {
      // Setting thread_muted flag on all other known statuses
      // belonging to same conversation
      const newStatus = this.allStatuses.get(id)
      newStatus.thread_muted = thread_muted

      if (newStatus.thread_muted !== undefined) {
        this.conversations
          .get(newStatus.statusnet_conversation_id)
          .forEach((status) => {
            status.thread_muted = thread_muted
          })
      }
    },

    /// Pin
    pinStatus(id) {
      return pinOwnStatus({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },
    unpinStatus(id) {
      return unpinOwnStatus({
        id,
        credentials: useOAuthStore().token,
      }).then(({ data: status, timestamp }) => {
        this.addNewStatuses({
          statuses: [status],
          timestamp,
        })
      })
    },

    /// Delete
    deleteStatus(id) {
      deleteStatus({
        id,
        credentials: useOAuthStore().token,
      })
        .then(() => {
          this.setDeleted({ id })
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
    setDeleted({ id }) {
      const newStatus = this.allStatuses.get(id)
      if (newStatus) newStatus.deleted = true
    },
    setManyDeleted(condition) {
      this.allStatuses.values().forEach((status) => {
        if (condition(status)) {
          status.deleted = true
        }
      })
    },

    // Search
    search({ q, resolve, limit, offset, following, type }) {
      return search2({
        q,
        resolve,
        limit,
        offset,
        following,
        type,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const { data, ...rest } = result
        useUsersStore().addNewUsers({
          ...rest,
          data: data.accounts,
        })

        useUsersStore().addNewUsers({
          ...rest,
          data: data.statuses.map((s) => s.user).filter(Boolean),
        })

        this.addNewStatuses({
          statuses: data.statuses,
        })

        data.statuses = data.statuses.map((s) => this.allStatuses.get(s.id))
        return data
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
          timeline.visibleStatuses.delete(id)
        })
      timeline.minVisibleId =
        timeline.visibleStatuses.length > 0
          ? last(timeline.visibleStatuses).id
          : 0
      timeline.maxId =
        timeline.statuses.length > 0 ? first(timeline.statuses).id : 0
    },
    setVirtualHeight({ statusId, height }) {
      this.allStatuses.get(statusId).virtualHeight = height
    },
    updateStatusWithPoll({ id, poll }) {
      const status = this.allStatuses.get(id)
      status.poll = poll
    },
    setLoading({ timeline, value }) {
      this.timelines[timeline].loading = value
    },
  },
})
