import Cookies from 'js-cookie'
import { last, map } from 'lodash'
import { defineStore } from 'pinia'

import {
  registerPushNotifications,
  unregisterPushNotifications,
} from '../services/sw/sw.js'
import {
  windowHeight,
  windowWidth,
} from '../services/window_utils/window_utils'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'
import { useChatsStore } from 'src/stores/chats.js'
import { useEmojiStore } from 'src/stores/emoji.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useListsStore } from 'src/stores/lists.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useTimelinesStore } from 'src/stores/timelines.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'

import { revokeToken } from 'src/api/oauth.js'
import {
  fetchFollowers,
  fetchFriends,
  fetchUser,
  fetchUserByName,
  searchUsers,
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
  unmuteDomain,
  unmuteUser,
} from 'src/api/user.js'

const getNotificationPermission = async () => {
  const Notification = window.Notification

  if (!Notification) return null
  if (Notification.permission === 'default')
    return Notification.requestPermission()
  return Notification.permission
}

export const useUsersStore = defineStore('users', {
  state: () => ({
    loggingIn: false,
    lastLoginName: null,
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
    tagUser({ user: { id }, tag }) {
      const user = this.users.get(id)
      user.tags.add(tag)
    },
    untagUser({ user: { id }, tag }) {
      const user = this.users.get(id)
      user.tags.delete(tag)
    },
    updateRight({ user: { id }, right, value }) {
      const user = this.users.get(id)
      const newRights = user.rights
      newRights[right] = value
      user.rights = newRights
    },
    async updateUserAdminData({ user }) {
      const localUser = await this.fetchUserIfMissing({ id: user.id })

      localUser.adminData = user
      localUser.deactivated = !user.is_active
      localUser.tags = new Set(user.tags)
    },
    setCurrentUser(user) {
      this.lastLoginName = user.screen_name
      this.currentUser = user
    },
    clearCurrentUser() {
      this.currentUser = null
      this.lastLoginName = null
    },
    saveFriendIds(id, friendIds) {
      const user = this.users.get(id)
      const list = this.relationshipsLists.friends.get(user)
      friendIds.forEach((id) => list.add(id))
    },
    saveFollowerIds(id, followerIds) {
      const user = this.users.get(id)
      const list = this.relationshipsLists.followers.get(user)
      followerIds.forEach((id) => list.add(id))
    },
    // Because frontend doesn't have a reason to keep these stuff in memory
    // outside of viewing someones user profile.
    clearFriends(userId) {
      const user = this.users.get(userId)
      if (user) {
        user.friendIds = new Set()
      }
    },
    clearFollowers(userId) {
      const user = this.users.get(userId)
      if (user) {
        user.followerIds = new Set()
      }
    },
    addNewUsers(response) {
      const { data, timestamp } = response
      const users = Array.isArray(data) ? data : [data]

      return users.map((user) => {
        const existing = this.users.get(user.id) ?? {}
        const oldTimestamp = this.timestamps.get(existing)

        // Relationship might have different timestamp and
        // might need updating separate from user
        const relationship = this.updateUserRelationships({
          timestamp,
          data: { id: user.id, ...(user.relationship ?? {}) },
        })[0]

        // implicit: if oldTimestamp is undefined this will still be false
        if (oldTimestamp > timestamp) return existing // not overwriting old data with new

        const { relationship: unused1, ...newUser } = user

        // Initializing reactivity
        if (!this.users.has(user.id)) this.users.set(user.id, existing)
        const reactive = this.users.get(user.id)

        // Relying on object reactivity to avoid mutating the Map
        reactive.relationship = relationship

        Object.entries(newUser).forEach(([k, v]) => {
          reactive[k] = v
        })

        // Updating the timestamp
        this.timestamps.set(reactive, timestamp)

        // Avoiding excessive Map mutation
        if (!this.users.has(user.id)) {
          this.usersByName.set(user.screen_name.toLowerCase(), reactive)
          this.usersByURL.set(user.url.toLowerCase(), reactive)
        }

        if (user.id === this.currentUser.id) {
          this.currentUser = reactive
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
        if (!optimism && oldTimestamp > timestamp) existing

        // Initializing reactivity
        if (!this.relationships.has(id)) this.relationships.set(id, existing)
        const reactive = this.relationships.get(id)

        // Relying on reactivity
        Object.entries(relationship).forEach(([k, v]) => {
          reactive[k] = v
        })

        if (timestamp) {
          this.timestamps.set(reactive)
        }

        // Updating user property if there is such a user
        if (this.users.has(id)) {
          this.users.get(id).relationship = reactive
        }

        return reactive
      })
    },
    updateUserInLists({ id, inLists }) {
      this.users.get(id).inLists = inLists
    },
    saveBlockIds(blockIds) {
      this.currentUser.blockIds = blockIds
    },
    addBlockId(blockId) {
      this.currentUser.blockIds.add(blockId)
    },
    setBlockIdsMaxId(blockIdsMaxId) {
      this.currentUser.blockIdsMaxId = blockIdsMaxId
    },
    saveMuteIds(muteIds) {
      this.currentUser.muteIds = muteIds
    },
    setMuteIdsMaxId(muteIdsMaxId) {
      this.currentUser.muteIdsMaxId = muteIdsMaxId
    },
    addMuteId(muteId) {
      this.currentUser.muteIds.add(muteId)
    },
    saveDomainMutes(domainMutes) {
      this.currentUser.domainMutes = domainMutes
    },
    addDomainMute(domain) {
      if (this.currentUser.domainMutes.includes(domain)) {
        this.currentUser.domainMutes.push(domain)
      }
    },
    removeDomainMute(domain) {
      const index = this.currentUser.domainMutes.indexOf(domain)
      if (index !== -1) {
        this.currentUser.domainMutes.splice(index, 1)
      }
    },
    setPinnedToUser(status) {
      const user = this.users.get(status.user.id)
      user.pinnedStatusIds = user.pinnedStatusIds || []
      const index = user.pinnedStatusIds.indexOf(status.id)

      if (status.pinned && index === -1) {
        user.pinnedStatusIds.push(status.id)
      } else if (!status.pinned && index !== -1) {
        user.pinnedStatusIds.splice(index, 1)
      }
    },
    setUserForStatus(status) {
      status.user = this.users.get(status.user.id)
    },
    setUserForNotification(notification) {
      if (notification.type !== 'follow') {
        notification.action.user = this.users.get(notification.action.user.id)
      }
      notification.from_profile = this.users.get(notification.from_profile.id)
    },
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

      // not found => fetch
      if (!user) {
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

        const result = await promise

        if (result?.data) {
          const { id, screen_name } = result.data

          // Save promise for future use
          this.fetchesIds.set(id, promise)
          this.fetchesNames.set(screen_name, promise)
          this.addNewUsers(result)
          return this.users.get(id)
        } else {
          return null
        }
      } else {
        return user
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
      if (this.currentUser) {
        fetchUserRelationship({
          id,
          credentials: useOAuthStore().token,
        }).then((result) => this.updateUserRelationships(result))
      }
    },
    fetchUserInLists(id) {
      if (this.currentUser) {
        fetchUserInLists({
          id,
          credentials: useOAuthStore().token,
        }).then(({ data: inLists }) => this.updateUserInLists({ id, inLists }))
      }
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
          this.saveBlockIds(new Set(blocks.map(({ id }) => id)))
        } else {
          blocks.forEach(({ id }) => this.addBlockId(id))
        }
        if (blocks.length) {
          this.setBlockIdsMaxId(last(blocks).id)
        }
        this.addNewUsers(result)
        return blocks
      })
    },
    blockUser(id, expiresIn = 0) {
      const store = window.vuex

      const predictedRelationship = this.relationships[id] || { id }
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })
      this.addBlockId(id)

      return blockUser({ id, expiresIn }).then((result) => {
        this.updateUserRelationships(result)
        this.addBlockId(id)

        store.commit('removeStatus', { timeline: 'friends', userId: id })
        store.commit('removeStatus', { timeline: 'public', userId: id })
        store.commit('removeStatus', {
          timeline: 'publicAndExternal',
          userId: id,
        })
      })
    },
    unblockUser(id) {
      return unblockUser({ id }).then((data) =>
        this.updateUserRelationships(data),
      )
    },
    removeUserFromFollowers(id) {
      return removeUserFromFollowers({ id }).then((data) =>
        this.updateUserRelationships(data),
      )
    },
    blockUsers(data = []) {
      return Promise.all(data.map((d) => this.blockUser(d)))
    },
    unblockUsers(data = []) {
      return Promise.all(data.map((d) => unblockUser(d)))
    },
    editUserNote({ id, comment }) {
      return editUserNote({ id, comment }).then(({ data }) =>
        this.updateUserRelationships(data),
      )
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
          this.saveMuteIds(new Set(mutes.map(({ id }) => id)))
        } else {
          mutes.forEach(({ id }) => this.addMuteId(id))
        }
        if (mutes.length) {
          this.setMuteIdsMaxId(last(mutes).id)
        }
        this.addNewUsers(result)
        return mutes
      })
    },
    muteUser(id, expiresIn = 0) {
      const predictedRelationship = this.relationships[id] || { id }
      predictedRelationship.muting = true
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })
      this.addMuteId(id)

      return muteUser({
        id,
        expiresIn,
        credentials: useOAuthStore().token,
      }).then(({ data }) => {
        this.updateUserRelationships(data)
        this.addMuteId(id)
      })
    },
    unmuteUser(id) {
      const predictedRelationship = this.relationships[id] || { id }
      predictedRelationship.muting = false
      this.updateUserRelationships({
        optimism: true,
        data: [predictedRelationship],
      })

      return unmuteUser({ id }).then(({ data }) =>
        this.updateUserRelationships(data),
      )
    },
    hideReblogs(id) {
      return followUser({
        id,
        reblogs: false,
        credentials: useOAuthStore().token,
      }).then(({ data }) => this.updateUserRelationships(data))
    },
    showReblogs(id) {
      return followUser({
        id,
        reblogs: true,
        credentials: useOAuthStore().token,
      }).then(({ data }) => this.updateUserRelationships(data))
    },
    muteUsers(data = []) {
      return Promise.all(data.map((d) => this.muteUser(d)))
    },
    unmuteUsers(ids = []) {
      return Promise.all(ids.map((d) => this.unmuteUser(d)))
    },
    fetchDomainMutes() {
      return fetchDomainMutes({
        credentials: useOAuthStore().token,
      }).then(({ data: domainMutes }) => {
        this.saveDomainMutes(domainMutes)
        return domainMutes
      })
    },
    muteDomain(domain) {
      return muteDomain({
        domain,
        credentials: useOAuthStore().token,
      }).then(() => this.addDomainMute(domain))
    },
    unmuteDomain(domain) {
      return unmuteDomain({
        domain,
        credentials: useOAuthStore().token,
      }).then(() => this.removeDomainMute(domain))
    },
    muteDomains(domains = []) {
      return Promise.all(domains.map((domain) => this.muteDomain(domain)))
    },
    unmuteDomains(domain = []) {
      return Promise.all(domain.map((domain) => this.unmuteDomain(domain)))
    },
    fetchFriends(id) {
      const user = this.users.get(id)
      const maxId = last([...this.relationshipsLists.friends.get(user)])
      return fetchFriends({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then((result) => {
        this.addNewUsers(result)
        this.saveFriendIds(id, map(result.data, 'id'))
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
        this.addNewUsers(result)
        this.saveFollowerIds(id, map(result.data, 'id'))
        return result.data
      })
    },
    subscribeUser(id) {
      return followUser({
        id,
        notify: true,
        credentials: useOAuthStore().token,
      }).then(({ data }) => this.updateUserRelationships(data))
    },
    unsubscribeUser(id) {
      return followUser({
        id,
        notify: false,
        credentials: useOAuthStore().token,
      }).then(({ data }) => this.updateUserRelationships(data))
    },
    registerPushNotifications() {
      const token = this.currentUser.credentials
      const vapidPublicKey = useInstanceStore().vapidPublicKey
      const isEnabled = useMergedConfigStore().mergedConfig.webPushNotifications
      const notificationVisibility =
        useMergedConfigStore().mergedConfig.notificationVisibility

      registerPushNotifications(
        isEnabled,
        vapidPublicKey,
        token,
        notificationVisibility,
      )
    },
    unregisterPushNotifications() {
      const token = this.currentUser.credentials

      unregisterPushNotifications(token)
    },
    searchUsers({ query }) {
      return searchUsers({
        query,
        credentials: useOAuthStore().token,
      }).then(({ data: users }) => {
        this.addNewUsers(users)
        return users
      })
    },

    logout() {
      const store = window.vuex
      const oauth = useOAuthStore()

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
          this.clearCurrentUser()
          store.dispatch('stopFetchingNotifications')
          useListsStore().stopFetching()
          useBookmarkFoldersStore().stopFetching()
          store.dispatch('stopFetchingFollowRequests')
          store.commit('clearNotifications')
          useTimelinesStore().deactivateAll()
          useStatusesStore().resetStatuses()
          useNotificationsStore().clearNotifications()
          useChatsStore().resetChats()
          oauth.clearToken()
          Cookies.remove('__Host-pleroma_key', { path: '/' })
          useInterfaceStore().setLastTimeline('public-timeline')
          useInterfaceStore().setLayoutWidth(windowWidth())
          useInterfaceStore().setLayoutHeight(windowHeight())
        })
    },
    loginUser(accessToken) {
      return new Promise((resolve, reject) => {
        const store = window.vuex
        const dispatch = store.dispatch

        this.loggingIn = true

        verifyCredentials({
          credentials: useOAuthStore().token,
        })
          .then(({ data: user, ...rest }) => {
            // user.credentials = userCredentials
            user.credentials = accessToken
            user.blockIds = new Set()
            user.muteIds = new Set()
            user.domainMutes = new Set()
            this.setCurrentUser(user)

            useSyncConfigStore()
              .initSyncConfig(user)
              .then(() => {
                useInterfaceStore()
                  .applyTheme()
                  .catch((e) => {
                    console.error('Error setting theme', e)
                  })
              })
            useUserHighlightStore().initUserHighlight(user)
            this.addNewUsers({ data: user, ...rest })

            useEmojiStore().fetchEmoji()

            getNotificationPermission().then((permission) =>
              useInterfaceStore().setNotificationPermission(permission),
            )

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
              dispatch('setWsToken', user.token)
              dispatch('initializeSocket')
            }

            // DMs and Home
            useNotificationsStore().activate()
            useTimelinesStore().activatePersistents()

            if (useInstanceCapabilitiesStore().pleromaChatMessagesAvailable) {
              // Start fetching chats
              useChatsStore().startFetchingChats()
            }

            useListsStore().startFetching()
            useBookmarkFoldersStore().startFetching()

            if (user.locked) {
              dispatch('startFetchingFollowRequests')
            }

            if (useMergedConfigStore().mergedConfig.useStreamingApi) {
              useStreamingStore().initSocket(true)
            }

            // Start fetching things that don't need to block the UI
            useAnnouncementsStore().startFetchingAnnouncements()

            this.fetchMutes()
            dispatch('loadDrafts')

            useInterfaceStore().setLayoutWidth(windowWidth())
            useInterfaceStore().setLayoutHeight(windowHeight())

            // Fetch our friends
            fetchFriends({ id: user.id }).then((friends) =>
              this.addNewUsers(friends),
            )
            this.loggingIn = false
            resolve()
          })
          .catch((error) => {
            console.error(error)

            // Authentication failed
            this.loggingIn = false

            // remove authentication token on client/authentication errors
            if ([400, 401, 403, 422].includes(error.statusCode)) {
              useOAuthStore().clearToken()
            }

            this.loggingIn = false
            if (error.tatusCode === 401) {
              throw new Error('Wrong username or password', error)
            } else {
              throw new Error('An error occurred, please try again', error)
            }
          })
      })
    },
  },
  persist: {
    paths: ['lastLoginName'],
  },
})
