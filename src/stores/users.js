import Cookies from 'js-cookie'
import { last } from 'lodash'
import { defineStore } from 'pinia'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'
import { useChatsStore } from 'src/stores/chats.js'
import { useEmojiStore } from 'src/stores/emoji.js'
import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useListsStore } from 'src/stores/lists.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useShoutStore } from 'src/stores/shout.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useProfileConfigStore } from 'src/stores/profile_config.js'
import { useTimelinesStore } from 'src/stores/timelines.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'

import { revokeToken } from 'src/api/oauth.js'
import {
  fetchFollowers,
  fetchFriends,
  fetchUser,
  fetchUserByName,
  verifyCredentials,
} from 'src/api/public.js'
import {
  blockUser,
  editUserNote,
  fetchBlocks,
  fetchDomainMutes,
  fetchMutes,
  fetchUserInLists,
  fetchUserRelationship,
  followUser,
  muteDomain,
  muteUser,
  removeUserFromFollowers,
  unblockUser,
  unfollowUser,
  unmuteDomain,
  unmuteUser,
} from 'src/api/user.js'
import { WSConnectionStatus } from 'src/api/websocket.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

export const useUsersStore = defineStore('users', {
  state: () => ({
    loggingIn: false,
    currentUser: null,
    users: new Map(),
    usersByName: new Map(),
    usersByURL: new Map(),
    relationships: new Map(),
    relationshipsLists: {
      friends: new WeakMap(),
      followers: new WeakMap(),
    },
    timestamps: new WeakMap(),
    fetchesIds: new Map(),
    fetchesNames: new Map(),
    followPollers: new Map(),
    followPollersAttempts: new Map(),
  }),
  getters: {
    loggedIn: (state) => !!state.currentUser,
    findUser: (state) => (query) => {
      return state.users.get(query)
    },
    findUserByName: (state) => (query) => {
      return state.usersByName.get(query.toLowerCase())
    },
    findUserByUrl: (state) => (query) => {
      return state.usersByURL.get(query.toLowerCase())
    },
    relationship: (state) => (id) => {
      const rel = id && state.relationships.get(id)
      return rel || { id, loading: true }
    },
  },
  actions: {
    // Main updates
    addNewUsers(response) {
      const { data, timestamp } = response
      const users = Array.isArray(data) ? data : [data]

      return users.map((user) => {
        const existing = this.users.get(user.id) ?? {}
        const oldTimestamp = this.timestamps.get(existing)
        //
        // Relationship might have different timestamp and
        // might need updating separate from user
        const oldRelationship = this.relationships.get(user.id)
        const oldRelationshipTimestamp = this.timestamps.get(oldRelationship)
        let relationship

        // Only need an update if new user data has relationship
        if (user.relationship) {
          // Only update if there is no old data or if it's outdated
          if (
            oldRelationship === undefined ||
            timestamp > oldRelationshipTimestamp
          ) {
            relationship = this.updateUserRelationships({
              timestamp,
              data: { id: user.id, ...user.relationship },
            })[0]
          }
        } else {
          relationship = oldRelationship
        }

        // implicit: if oldTimestamp is undefined this will still be false
        if (oldTimestamp > timestamp) return existing // not overwriting old data with new

        const { relationship: unused1, ...newUser } = user

        let reactive = this.users.get(user.id)
        // Initializing reactivity & avoiding excessive Map mutation
        if (!reactive) {
          this.users.set(user.id, existing)

          reactive = this.users.get(user.id)
          this.usersByName.set(user.screen_name.toLowerCase(), reactive)
          this.usersByURL.set(user.url.toLowerCase(), reactive)
        }

        // Relying on object reactivity to avoid mutating the Map
        reactive.relationship = relationship ?? reactive.relationship

        Object.entries(newUser).forEach(([k, v]) => {
          reactive[k] = v
        })

        // Updating the timestamp
        this.timestamps.set(reactive, timestamp)

        if (user.id === this.currentUser?.id) {
          this.currentUser = reactive
          useProfileConfigStore().update(reactive)
        }

        // Initialize some stuff
        const { friends, followers } = this.relationshipsLists
        if (!friends.has(reactive)) friends.set(reactive, new Set())
        if (!followers.has(reactive)) followers.set(reactive, new Set())

        return reactive
      })
    },
    updateUserRelationships({ timestamp, optimism, data }) {
      const relationships = Array.isArray(data) ? data : [data]

      return relationships.map((relationship) => {
        const { id } = relationship
        const existing = this.relationships.get(id) ?? {}
        const oldTimestamp = this.timestamps.get(existing)

        // implicit: if oldTimestamp is undefined this will still be false
        if (!optimism && oldTimestamp > timestamp) return existing

        // Initializing reactivity
        if (!this.relationships.has(id)) this.relationships.set(id, existing)
        const reactive = this.relationships.get(id)

        // Relying on reactivity
        Object.entries(relationship).forEach(([k, v]) => {
          reactive[k] = v
        })

        if (timestamp) {
          this.timestamps.set(reactive, timestamp)
        }

        // Updating user property if there is such a user
        if (this.users.has(id)) {
          this.users.get(id).relationship = reactive
        }

        // Update block/mute lists
        if (this.currentUser && id !== this.currentUser.id) {
          ;[
            ['muting', this.currentUser.muteIds],
            ['blocking', this.currentUser.blockIds],
            [
              'following',
              this.relationshipsLists.friends.get(this.currentUser),
            ],
            [
              'followed_by',
              this.relationshipsLists.followers.get(this.currentUser),
            ],
          ].forEach(([relationshipName, list]) => {
            if (relationship[relationshipName]) {
              list?.add(id)
            } else {
              list?.delete(id)
            }
          })
        }

        return reactive
      })
    },

    // Misc updates
    updateUserAdminData(id, data) {
      const user = this.users.get(id)
      if (!user) {
        console.warn(
          `User id ${id} somehow not found during admin data update!`,
        )
        return
      }
      user.adminData = data
      user.deactivated = !data.is_active
      user.tags = new Set(data.tags)
    },
    updateRight(id, right, value) {
      const user = this.users.get(id)
      const newRights = user.rights ?? {}
      newRights[right] = value
      user.rights = newRights
    },

    // Because frontend doesn't have a reason to keep these stuff in memory
    // outside of viewing someones user profile.
    clearFollowLists(userId) {
      const user = this.users.get(userId)
      if (user) {
        this.relationshipsLists.friends.set(user, new Set())
        this.relationshipsLists.followers.set(user, new Set())
      }
    },

    // Fetches
    async fetchUserIfMissing({ id, name }) {
      let findFunc
      let fetchFunc
      let map
      let identifier

      if (id) {
        findFunc = this.findUser
        fetchFunc = this.fetchUser
        map = this.fetchesIds
        identifier = id
      } else if (name) {
        findFunc = this.findUserByName
        fetchFunc = this.fetchUserByName
        map = this.fetchesNames
        identifier = name
      } else {
        throw new TypeError('No identifier provided')
      }

      // Search in cache
      const user = findFunc(identifier)

      if (user) return user
      // not found => fetch
      let promise

      // Did we already search for this user?
      if (map.has(identifier)) {
        // if so, reuse the promise
        promise = map.get(identifier)
      } else {
        // if not, make a new one
        promise = fetchFunc(identifier)
      }

      map.set(identifier, promise)

      try {
        const result = await promise
        if (result) {
          const { id, screen_name } = result

          // Save promise for future use
          this.fetchesIds.set(id, promise)
          this.fetchesNames.set(screen_name, promise)
          return this.users.get(id)
        } else {
          return null
        }
      } catch (e) {
        console.error(`Failed fetching user ${identifier}`, e)
        map.delete(identifier)
        throw e
      }
    },
    async fetchUser(id) {
      try {
        const result = await fetchUser({
          id,
          credentials: useOAuthStore().token,
        })

        this.addNewUsers(result)

        return this.users.get(result.data.id)
      } catch (error) {
        if (error.name === 'StatusCodeError' && error.statusCode === 404) {
          console.warn(`User ${id} not found`)
          return null
        } else {
          throw error
        }
      }
    },
    async fetchUserByName(name) {
      try {
        const result = await fetchUserByName({
          name,
          credentials: useOAuthStore().token,
        })

        this.addNewUsers(result)

        return this.users.get(result.data.id)
      } catch (error) {
        if (error.name === 'StatusCodeError' && error.statusCode === 404) {
          console.warn(`User ${name} not found`)
          return null
        } else {
          throw error
        }
      }
    },
    fetchUserRelationship(id) {
      return fetchUserRelationship({
        id,
        credentials: useOAuthStore().token,
      }).then((result) => this.updateUserRelationships(result))
    },
    fetchFriends(id) {
      const user = this.users.get(id)
      const maxId = last([...this.relationshipsLists.friends.get(user)])
      return fetchFriends({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const users = this.addNewUsers(result)
        const list = this.relationshipsLists.friends.get(user)
        users.forEach(({ id }) => list.add(id))
        return result.data
      })
    },
    fetchFollowers(id) {
      const user = this.users.get(id)
      const maxId = last([...this.relationshipsLists.followers.get(user)])
      return fetchFollowers({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const users = this.addNewUsers(result)
        const list = this.relationshipsLists.followers.get(user)
        users.forEach(({ id }) => list.add(id))
        return result.data
      })
    },
    fetchUserInLists(id) {
      if (this.currentUser) {
        return fetchUserInLists({
          id,
          credentials: useOAuthStore().token,
        }).then(({ data: inLists }) => {
          this.users.get(id).inLists = inLists
        })
      }
    },
    fetchMutes(args) {
      const { reset } = args || {}

      const maxId = this.currentUser.muteIdsMaxId
      return fetchMutes({
        maxId,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const { data: mutes } = result
        if (reset) {
          this.currentUser.muteIds = new Set(mutes.map(({ id }) => id))
        } else {
          mutes.forEach(({ id }) => this.currentUser.muteIds.add(id))
        }
        if (mutes.length) {
          this.currentUser.muteIdsMaxId = last(mutes).id
        }
        this.addNewUsers(result)
        return mutes
      })
    },
    fetchBlocks(args) {
      const { reset } = args || {}

      const maxId = this.currentUser.blockIdsMaxId
      return fetchBlocks({
        maxId,
        credentials: useOAuthStore().token,
      }).then((result) => {
        const { data: blocks } = result
        if (reset) {
          this.currentUser.blockIds = new Set(blocks.map(({ id }) => id))
        } else {
          blocks.forEach(({ id }) => this.currentUser.blockIds.add(id))
        }
        if (blocks.length) {
          this.currentUser.blockIdsMaxId = last(blocks).id
        }
        this.addNewUsers(result)
        return blocks
      })
    },
    fetchDomainMutes() {
      return fetchDomainMutes({
        credentials: useOAuthStore().token,
      }).then(({ data: domainMutes }) => {
        this.currentUser.domainMutes = new Set(domainMutes)
        return domainMutes
      })
    },

    // Actions
    /// Follow
    async followUser(id) {
      // Don't spam follow requests if we are already polling
      if (this.followPollers.has(id)) return

      const followFunc = () =>
        followUser({
          id,
          credentials: useOAuthStore().token,
        }).then((result) => this.updateUserRelationships(result))

      const checker = async (func = () => this.fetchUserRelationship(id)) => {
        await func() // Either fetch relationships or follow request
        const relationship = this.relationships.get(id)

        return (
          relationship.following ||
          (relationship.locked && relationship.requested)
        )
      }

      const immediate = await checker(followFunc)
      if (immediate) return // If follow goes through immediately don'd to looping

      const loop = async () => {
        const attempts = this.followPollersAttempts.get(id)
        const result = await checker()

        if (result || attempts === 1) {
          this.followPollersAttempts.delete(id)
          this.followPollers.get(id).stop()
          this.followPollers.delete(id)
        } else {
          this.followPollersAttempts.set(id, attempts - 1)
        }
      }

      this.followPollersAttempts.set(id, 3)
      this.followPollers.set(id, promiseInterval(loop, 500))
    },
    async unfollowUser(id) {
      const result = await unfollowUser({
        id,
        credentials: useOAuthStore().token,
      })

      return this.updateUserRelationships(result)
    },

    /// Subscribe
    subscribeUser(id) {
      return followUser({
        id,
        notify: true,
        credentials: useOAuthStore().token,
      }).then((result) => this.updateUserRelationships(result))
    },
    unsubscribeUser(id) {
      return followUser({
        id,
        notify: false,
        credentials: useOAuthStore().token,
      }).then((result) => this.updateUserRelationships(result))
    },

    /// User Note
    editUserNote(id, comment) {
      return editUserNote({ id, comment }).then((result) =>
        this.updateUserRelationships(result),
      )
    },

    /// Hide reblogs
    hideReblogs(id) {
      return followUser({
        id,
        reblogs: false,
        credentials: useOAuthStore().token,
      }).then((result) => this.updateUserRelationships(result))
    },
    showReblogs(id) {
      return followUser({
        id,
        reblogs: true,
        credentials: useOAuthStore().token,
      }).then((result) => this.updateUserRelationships(result))
    },

    /// Remove follower
    removeUserFromFollowers(id) {
      return removeUserFromFollowers({ id }).then((result) =>
        this.updateUserRelationships(result),
      )
    },

    /// Mute
    muteUser(id, expiresIn = 0) {
      const predictedRelationship = this.relationships.get(id) || { id }
      predictedRelationship.muting = true
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })

      return muteUser({
        id,
        expiresIn,
        credentials: useOAuthStore().token,
      }).then((result) => {
        this.updateUserRelationships(result)
      })
    },
    muteUsers(data = []) {
      return Promise.all(data.map((d) => this.muteUser(d)))
    },
    unmuteUser(id) {
      const predictedRelationship = this.relationships.get(id) || { id }
      predictedRelationship.muting = false
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })

      return unmuteUser({ id }).then((result) =>
        this.updateUserRelationships(result),
      )
    },
    unmuteUsers(ids = []) {
      return Promise.all(ids.map((d) => this.unmuteUser(d)))
    },

    /// Block
    blockUser(id, expiresIn = 0) {
      const predictedRelationship = this.relationships.get(id) || { id }
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })

      return blockUser({ id, expiresIn }).then((result) => {
        this.updateUserRelationships(result)

        const ids = useStatusesStore().wipeUserStatuses(id)
        useTimelinesStore().wipeStatuses(ids)
        useNotificationsStore().wipeStatuses(ids)
      })
    },
    blockUsers(data = []) {
      return Promise.all(data.map((d) => this.blockUser(d)))
    },
    unblockUser(id) {
      return unblockUser({ id }).then((result) => {
        this.updateUserRelationships(result)
      })
    },
    unblockUsers(data = []) {
      return Promise.all(data.map((d) => this.unblockUser(d)))
    },

    /// Domain Mute
    muteDomain(domain) {
      return muteDomain({
        domain,
        credentials: useOAuthStore().token,
      }).then(() => this.currentUser.domainMutes.add(domain))
    },
    unmuteDomain(domain) {
      return unmuteDomain({
        domain,
        credentials: useOAuthStore().token,
      }).then(() => this.currentUser.domainMutes.delete(domain))
    },
    muteDomains(domains = []) {
      return Promise.all(domains.map((domain) => this.muteDomain(domain)))
    },
    unmuteDomains(domain = []) {
      return Promise.all(domain.map((domain) => this.unmuteDomain(domain)))
    },

    // Login/Logout
    async loginUser(accessToken) {
      const store = window.vuex
      const dispatch =
        store?.dispatch ??
        (() => {
          /* no-op */
        }) // for tests

      this.loggingIn = true

      try {
        const { data: user, ...rest } = await verifyCredentials({
          credentials: useOAuthStore().token,
        })

        user.blockIds = new Set()
        user.muteIds = new Set()
        user.domainMutes = new Set()

        useTimelinesStore().deactivateAll()
        useStatusesStore().resetStatuses()

        this.users = new Map()
        this.usersByName = new Map()
        this.usersByURL = new Map()
        this.relationships = new Map()
        this.currentUser = user
        this.addNewUsers({ data: user, ...rest })

        useInterfaceStore().onLogin()
        useSyncConfigStore()
          .initSyncConfig(user)
          .then(() => {
            useInterfaceStore()
              .applyTheme()
              .catch((e) => {
                console.error('Error setting theme', e)
              })
          })
        useProfileConfigStore().onLogin(user)

        useUserHighlightStore().initUserHighlight(user)

        useEmojiStore().fetchEmoji()

        // Do server-side storage migrations

        // Debug snippet to clean up storage and reset migrations
        /*
        // Reset wordfilter
        Object.keys(
        useSyncConfigStore().prefsStorage.simple.muteFilters
        ).forEach(key => {
        useSyncConfigStore().unsetSimplePrefAndSave({ path: 'muteFilters.' + key, value: null })
        })

        // Reset flag to 0 to re-run migrations
        useSyncConfigStore().setFlag({ flag: 'configMigration', value: 0 })
        /**/

        if (user.token) {
          // Shoutbox
          useShoutStore().initializeSocket()
          useShoutStore().initializeShout()
        }

        // DMs and Home
        useTimelinesStore().activatePersistents()
        useNotificationsStore().activate()

        if (useInstanceCapabilitiesStore().pleromaChatMessagesAvailable) {
          // Start fetching chats
          useChatsStore().startFetching()
        }

        useListsStore().startFetching()
        useBookmarkFoldersStore().startFetching()

        if (user.locked) {
          useFollowRequestsStore().startFetching()
        }

        if (useMergedConfigStore().mergedConfig.useStreamingApi) {
          useStreamingStore().initSocket(true)
        }

        // Start fetching things that don't need to block the UI
        useAnnouncementsStore().startFetching()

        this.fetchMutes()
        dispatch('loadDrafts')
      } catch (error) {
        console.error(error)

        // Authentication failed
        this.loggingIn = false

        // remove authentication token on client/authentication errors
        if ([400, 401, 403, 422].includes(error.statusCode)) {
          useOAuthStore().clearToken()
        }

        if (error.tatusCode === 401) {
          throw new Error('Wrong username or password', error)
        } else {
          throw new Error('An error occurred, please try again', error)
        }
      } finally {
        this.loggingIn = false
      }
    },
    logout() {
      const store = window.vuex
      const oauth = useOAuthStore()

      // Pause fetching
      useNotificationsStore().pause()
      useTimelinesStore().pauseAll()

      // Pause-less stores
      useAnnouncementsStore().stopFetching()
      useListsStore().stopFetching()
      useBookmarkFoldersStore().stopFetching()
      useChatsStore().stopFetching()
      if (this.currentUser.locked) {
        useFollowRequestsStore().stopFetching()
      }

      // NOTE: No need to verify the app still exists, because if it doesn't,
      // the token will be invalid too
      return oauth
        .ensureApp()
        .then((app) => {
          const params = {
            app,
            instance: useInstanceStore().server,
            token: oauth.userToken,
          }

          return revokeToken(params)
        })
        .then(() => {
          oauth.clearToken()
          useShoutStore().disconnectSocket()

          this.currentUser = null

          useNotificationsStore().deactivate()

          // Full reset on logout success
          useTimelinesStore().deactivateAll()
          useStatusesStore().resetStatuses()
          useChatsStore().resetChats()

          this.users = new Map()
          this.usersByName = new Map()
          this.usersByURL = new Map()
          this.relationships = new Map()

          // Socket is most likely already closed by server
          if (
            useMergedConfigStore().mergedConfig.useStreamingApi &&
            useStreamingStore().state !== WSConnectionStatus.CLOSED
          ) {
            useStreamingStore().stopSocket()
          }

          Cookies.remove('__Host-pleroma_key', { path: '/' })
          useInterfaceStore().onLogout()
          useProfileConfigStore().onLogout()
        })
        .catch((e) => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'user.logout_failure',
            messageArgs: {
              error: e,
            },
            level: 'error',
          })
          console.error('Logout error!', e)

          useAnnouncementsStore().startFetching()
          useListsStore().startFetching()
          useBookmarkFoldersStore().startFetching()
          useChatsStore().startFetching()
          useFollowRequestsStore().startFetching()
        })
        .finally(() => {
          useNotificationsStore().resume()
          useTimelinesStore().resumeAll()
        })
    },
  },
})
