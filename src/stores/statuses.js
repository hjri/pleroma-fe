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
      const handleUpdate = ({ data, timestamp }) =>
        this.addNewStatuses({ statuses: data, timestamp })
      const handleDelete = ({ data }) =>
        data.forEach((id) => this.setDeleted(id))

      const socket = {
        et,
        handlers: {
          handleUpdate,
          handleDelete,
        },
      }

      et.addEventListener('update', handleUpdate)
      et.addEventListener('status.update', handleUpdate)
      et.addEventListener('delete', handleDelete)

      useStreamingStore().addSubscriber(socket)
      this.socket = socket
    },
    resetStatuses() {
      this.socket.et.removeEventListener('update', this.socket.handleUpdate)
      this.socket.et.removeEventListener(
        'status.update',
        this.socket.handleUpdate,
      )
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
        ({ id }) => currentUser?.id === id,
      )
    },
    addFavs({ id, favoritedByUsers }) {
      const currentUser = useUsersStore().currentUser
      const newStatus = this.allStatuses.get(id)
      newStatus.favoritedBy = favoritedByUsers.filter(Boolean)
      // favorites stats can be incorrect based on polling condition, let's update them using the most recent data
      newStatus.fave_num = newStatus.favoritedBy.length
      newStatus.favorited = !!newStatus.favoritedBy.find(
        ({ id }) => currentUser?.id === id,
      )
    },
    addEmojiReactionsBy({ id, emojiReactions }) {
      const status = this.allStatuses.get(id)
      status.emoji_reactions = emojiReactions
    },

    // Actions
    requestInteract({ name, id, optimisticCall, apiCall, argument, value }) {
      const oldValue = !value // Assumption

      const apiArgs = (() => {
        switch (name) {
          case 'emoji':
            return { emoji: argument }
          case 'bookmark':
            return { folder_id: argument }
          default:
            return {}
        }
      })()

      // Optimistic
      optimisticCall(id, value, argument)

      return apiCall({
        id,
        ...apiArgs,
        credentials: useOAuthStore().token,
      })
        .then(({ data: status, timestamp }) => {
          this.addNewStatuses({
            statuses: [status],
            timestamp,
          })
        })
        .catch((error) => {
          optimisticCall(id, oldValue, argument)

          console.error('Interact Error', error)
          useInterfaceStore().pushGlobalNotice({
            level: 'error',
            messageKey: 'status.interact_error',
            messageArgs: [error],
            timeout: 5000,
          })
        })
    },

    /// Favorite
    favorite(id) {
      return this.requestInteract({
        name: 'favorite',
        id,
        apiCall: favorite,
        optimisticCall: this.setFavorited,
        value: true,
      })
    },
    unfavorite(id) {
      return this.requestInteract({
        name: 'favorite',
        id,
        apiCall: unfavorite,
        optimisticCall: this.setFavorited,
        value: false,
      })
    },
    setFavorited(id, value) {
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
      return this.requestInteract({
        name: 'retweet',
        id,
        apiCall: retweet,
        optimisticCall: this.setRetweeted,
        value: true,
      })
    },
    unretweet(id) {
      return this.requestInteract({
        name: 'retweet',
        id,
        apiCall: unretweet,
        optimisticCall: this.setRetweeted,
        value: false,
      })
    },
    setRetweeted(id, value) {
      const newStatus = this.allStatuses.get(id)

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
      return this.requestInteract({
        name: 'emoji',
        id,
        apiCall: reactWithEmoji,
        optimisticCall: this.setOwnReaction,
        argument: emoji,
        value: true,
      })
    },
    unreactWithEmoji(id, emoji) {
      return this.requestInteract({
        name: 'emoji',
        id,
        apiCall: unreactWithEmoji,
        optimisticCall: this.setOwnReaction,
        argument: emoji,
        value: false,
      })
    },
    setOwnReaction(id, value, emoji) {
      const currentUser = useUsersStore().currentUser
      const status = this.allStatuses.get(id)
      const reactionIndex = status.emoji_reactions.findIndex(
        (react) => react.name === emoji,
      )
      const reactionPresent = reactionIndex >= 0
      if (!value && !reactionPresent) return

      const reaction = status.emoji_reactions[reactionIndex] || {
        name: emoji,
        count: 0,
        accounts: [],
      }

      const count = value ? reaction.count + 1 : reaction.count - 1

      const accounts = value
        ? [...reaction.accounts, currentUser]
        : accounts.filter((acc) => acc.id !== currentUser.id)

      const newReaction = {
        ...reaction,
        count,
        me: value,
        accounts,
      }

      if (reactionPresent && count > 0) {
        status.emoji_reactions[reactionIndex] = newReaction
      } else if (count === 0) {
        status.emoji_reactions = status.emoji_reactions.filter(
          (r) => r.name !== emoji,
        )
      } else {
        status.emoji_reactions.push(newReaction)
      }
    },

    /// Bookmark
    bookmark(id, bookmark_folder_id) {
      return this.requestInteract({
        name: 'bookmark',
        id,
        apiCall: bookmarkStatus,
        optimisticCall: this.setBookmarked,
        argument: bookmark_folder_id,
        value: false,
      })
    },
    unbookmark(id) {
      return this.requestInteract({
        name: 'bookmark',
        id,
        apiCall: unbookmarkStatus,
        optimisticCall: this.setBookmarked,
        value: false,
      })
    },
    setBookmarked(id, value, bookmark_folder_id) {
      const status = this.allStatuses.get(id)
      status.bookmarked = value

      // When unbookmarking we don't specify folder so we wanna keep
      // reference to the folder even when setting bookmarked to false
      // the proper reference will be updated when api call resolves
      if (bookmark_folder_id) {
        status.bookmark_folder_id = value ? bookmark_folder_id : null
      }
    },

    /// Mute
    muteConversation(id) {
      return this.requestInteract({
        name: 'mute',
        id,
        apiCall: muteConversation,
        optimisticCall: this.setMutedStatus,
        value: false,
      })
    },
    unmuteConversation(id) {
      return this.requestInteract({
        name: 'mute',
        id,
        apiCall: unmuteConversation,
        optimisticCall: this.setMutedStatus,
        value: false,
      })
    },
    setMutedStatus(id, value) {
      // Setting thread_muted flag on all other known statuses
      // belonging to same conversation
      const newStatus = this.allStatuses.get(id)
      newStatus.thread_muted = value

      if (newStatus.thread_muted !== undefined) {
        this.conversations
          .get(newStatus.statusnet_conversation_id)
          .forEach((status) => {
            status.thread_muted = value
          })
      }
    },

    /// Pin
    pinStatus(id) {
      return this.requestInteract({
        name: 'pin',
        id,
        apiCall: pinOwnStatus,
        optimisticCall: () => {
          /* no-op */
        },
        value: true,
      })
    },
    unpinStatus(id) {
      return this.requestInteract({
        name: 'pin',
        id,
        apiCall: unpinOwnStatus,
        optimisticCall: () => {
          /* no-op */
        },
        value: false,
      })
    },

    /// Delete
    deleteStatus(id) {
      deleteStatus({
        id,
        credentials: useOAuthStore().token,
      })
        .then(() => {
          this.setDeleted(id)
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
    setDeleted(id) {
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
