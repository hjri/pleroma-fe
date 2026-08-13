import { defineStore } from 'pinia'

import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import {
  fetchEmojiReactions,
  fetchFavoritedByUsers,
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

export const defaultState = () => ({
  allStatuses: new Map(),
  timestamps: new WeakMap(),
  scrobblesNextFetch: {},
  conversations: new Map(),
  favorites: new Set(),
  socket: null,
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

export const useStatusesStore = defineStore('statuses', {
  state: defaultState,
  actions: {
    // Init
    attachSocket() {
      const et = new EventTarget()
      const handleStatusMessage = ({ data, timestamp }) => {
        this.addNewStatuses({ statuses: [data.status], timestamp })
      }
      const handleUpdate = ({ detail: message }) => handleStatusMessage(message)
      const handleDelete = ({ detail: message }) => {
        console.log('DELETE', message)
        this.deleteStatus(message.data)
      }
      const socket = {
        et,
        handlers: {
          handleUpdate, handleDelete
        }
      }

      et.addEventListener('update', handleUpdate)
      et.addEventListener('status.update', handleUpdate)
      et.addEventListener('delete', handleDelete)

      useStreamingStore().addSubscriber(socket)
      this.socket = socket
    },
    resetStatuses() {
      this.socket.et.removeEventListener('update', this.socket.handleUpdate)
      this.socket.et.removeEventListener('status.update', this.socket.handleUpdate)
      this.socket.et.removeEventListener('delete', this.socket.handleDelete)

      const emptyState = defaultState()
      Object.entries(emptyState).forEach(([key, value]) => {
        this[key] = value
      })
    },

    addNewStatuses({ statuses, timestamp }) {
      // Sanity check
      if (!Array.isArray(statuses)) {
        throw new TypeError("Statuses aren't an array!")
      }

      // addStatus should always return "main" status,
      // not "sub-status" i.e. retweeted/quoted/liked status
      // in case of likes (which are not statuses) it should return null
      const addStatus = (data) => {
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

        // Work on quote
        if (status.quote) {
          status.quote = addStatus(status.quote)
        }

        return status
      }

      const processors = {
        status: (status) => {
          return addStatus(status)
        },
        edit: (status) => {
          return addStatus(status)
        },
        retweet: (status) => {
          // RetweetedStatuses are never shown immediately
          if (status.retweeted_status) addStatus(status.retweeted_status)
          return addStatus(status)
        },
        favorite: (favorite) => {
          // Only update if this is a new favorite.
          // Ignore our own favorites because we get info about likes as response to like request
          if (!this.favorites.has(favorite.id)) {
            this.favorites.add(favorite.id)

            const status = this.allStatuses.get(favorite.in_reply_to_status_id)

            if (status) {
              // This is our favorite, so the relevant bit.
              if (favorite.user.id === useUsersStore().currentUser?.id) {
                status.favorited = true
              } else {
                status.fave_num += 1
              }
            }
            return status
          }
          return null
        },
        follow: () => {
          // NOOP, it is known status but we don't do anything about it for now
          return null
        },
        default: (unknown) => {
          console.warn('unknown status type', unknown)
          return null
        },
      }

      return statuses.map((status) => {
        const type = status.type
        const processor = processors[type] ?? processors.default
        return processor(status)
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

    // Fetches
    fetchStatus(id) {
      return fetchStatus({ id }).then(({ data: status, timestamp }) =>
        this.addNewStatuses({ statuses: [status], timestamp }),
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
    setVirtualHeight({ statusId, height }) {
      this.allStatuses.get(statusId).virtualHeight = height
    },
    updateStatusWithPoll({ id, poll }) {
      const status = this.allStatuses.get(id)
      status.poll = poll
    },
  },
})
