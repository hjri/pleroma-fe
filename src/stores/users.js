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
import { useOAuthStore } from 'src/stores/oauth.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
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
    timestamps: new WeakMap(),
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
      const localUser = await this.fetchUserIfMissing(user.id)

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
    saveFriendIds({ id, friendIds }) {
      const user = this.users.get(id)
      user.friendIds = [...new Set([...(user.friendIds || []), ...friendIds])]
    },
    saveFollowerIds({ id, followerIds }) {
      const user = this.users.get(id)
      user.followerIds = [...new Set([user.followerIds || [], ...followerIds])]
    },
    // Because frontend doesn't have a reason to keep these stuff in memory
    // outside of viewing someones user profile.
    clearFriends(userId) {
      const user = this.users.get(userId)
      if (user) {
        user.friendIds = []
      }
    },
    clearFollowers(userId) {
      const user = this.users.get(userId)
      if (user) {
        user.followerIds = []
      }
    },
    addNewUsers(response) {
      const { data, timestamp } = response
      const users = Array.isArray(data) ? data : [data]

      users.forEach((user) => {
        const existing = this.users.get(user.id) ?? {}
        const oldTimestamp = this.timestamps.get(existing)

        // implicit: if oldTimestamp is undefined this will still be false
        if (oldTimestamp > timestamp) return // not overwriting old data with new

        const { relationship, ...old } = existing
        const { relationshop, ...neu } = user
        const newUser = { ...old, ...neu }

        this.users.set(user.id, newUser)
        this.usersByName.set(user.screen_name.toLowerCase(), newUser)
        this.usersByURL.set(user.url.toLowerCase(), newUser)
        this.timestamps.set(newUser, timestamp)

        if (user.id === this.currentUser.id) {
          this.currentUser = newUser
        }
      })
    },
    updateUserRelationship(relationships) {
      relationships.forEach((relationship) => {
        this.relationships[relationship.id] = relationship
      })
    },
    updateUserInLists({ id, inLists }) {
      this.users.get(id).inLists = inLists
    },
    saveBlockIds(blockIds) {
      this.currentUser.blockIds = blockIds
    },
    addBlockId(blockId) {
      if (this.currentUser.blockIds.includes(blockId)) {
        this.currentUser.blockIds.push(blockId)
      }
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
      if (this.currentUser.muteIds.includes(muteId)) {
        this.currentUser.muteIds.push(muteId)
      }
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
    async fetchUserIfMissing(id) {
      const user = this.findUser(id)
      if (!user) {
        return this.fetchUser(id)
      } else {
        return user
      }
    },
    fetchUser(id) {
      return fetchUser({
        id,
        credentials: useOAuthStore().token,
      })
        .then(({ data: user }) => {
          this.addNewUsers([user])
          return user
        })
        .catch((error) => {
          if (error.statusCode === 404) {
            console.warn(`User ${id} not found`)
          } else {
            throw error
          }
        })
    },
    fetchUserByName(name) {
      return fetchUserByName({
        name,
        credentials: useOAuthStore().token,
      }).then(({ data: user }) => {
        this.addNewUsers([user])
        return user
      })
    },
    fetchUserRelationship(id) {
      if (this.currentUser) {
        fetchUserRelationship({
          id,
          credentials: useOAuthStore().token,
        }).then(({ data: relationships }) =>
          this.updateUserRelationship(relationships),
        )
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
          this.saveBlockIds(blocks.map(({ id }) => id))
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
      this.updateUserRelationship([predictedRelationship])
      this.addBlockId(id)

      return blockUser({ id, expiresIn }).then(({ data: relationship }) => {
        this.updateUserRelationship([relationship])
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
      return unblockUser({ id }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
    },
    removeUserFromFollowers(id) {
      return removeUserFromFollowers({ id }).then((relationship) =>
        this.updateUserRelationship([relationship]),
      )
    },
    blockUsers(data = []) {
      return Promise.all(data.map((d) => this.blockUser(d)))
    },
    unblockUsers(data = []) {
      return Promise.all(data.map((d) => unblockUser(d)))
    },
    editUserNote({ id, comment }) {
      return editUserNote({ id, comment }).then((relationship) =>
        this.updateUserRelationship([relationship]),
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
          this.saveMuteIds(mutes.map(({ id }) => id))
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
      this.updateUserRelationship([predictedRelationship])
      this.addMuteId(id)

      return muteUser({
        id,
        expiresIn,
        credentials: useOAuthStore().token,
      }).then(({ data: relationship }) => {
        this.updateUserRelationship([relationship])
        this.addMuteId(id)
      })
    },
    unmuteUser(id) {
      const predictedRelationship = this.relationships[id] || { id }
      predictedRelationship.muting = false
      this.updateUserRelationship([predictedRelationship])

      return unmuteUser({ id }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
    },
    hideReblogs(id) {
      return followUser({
        id,
        reblogs: false,
        credentials: useOAuthStore().token,
      }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
    },
    showReblogs(id) {
      return followUser({
        id,
        reblogs: true,
        credentials: useOAuthStore().token,
      }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
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
      const maxId = last(user.friendIds)
      return fetchFriends({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then(({ data: friends }) => {
        this.addNewUsers(friends)
        this.saveFriendIds({ id, friendIds: map(friends, 'id') })
        return friends
      })
    },
    fetchFollowers(id) {
      const user = this.users.get(id)
      const maxId = last(user.followerIds)
      return fetchFollowers({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then(({ data: followers }) => {
        this.addNewUsers(followers)
        this.saveFollowerIds({ id, followerIds: map(followers, 'id') })
        return followers
      })
    },
    subscribeUser(id) {
      return followUser({
        id,
        notify: true,
        credentials: useOAuthStore().token,
      }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
    },
    unsubscribeUser(id) {
      return followUser({
        id,
        notify: false,
        credentials: useOAuthStore().token,
      }).then(({ data: relationship }) =>
        this.updateUserRelationship([relationship]),
      )
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
          store.dispatch('disconnectFromSocket')
          store.dispatch('stopFetchingTimeline', 'friends')
          store.dispatch('stopFetchingNotifications')
          useListsStore().stopFetching()
          useBookmarkFoldersStore().stopFetching()
          store.dispatch('stopFetchingFollowRequests')
          store.commit('clearNotifications')
          store.commit('resetStatuses')
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
            user.blockIds = []
            user.muteIds = []
            user.domainMutes = []
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
              dispatch('setWsToken', user.token)

              // Initialize the shout socket.
              dispatch('initializeSocket')
            }

            const startPolling = () => {
              // Start getting fresh posts.
              dispatch('startFetchingTimeline', { timeline: 'friends' })

              // Start fetching notifications
              dispatch('startFetchingNotifications')

              if (useInstanceCapabilitiesStore().pleromaChatMessagesAvailable) {
                // Start fetching chats
                useChatsStore().startFetchingChats()
              }
            }

            useListsStore().startFetching()
            useBookmarkFoldersStore().startFetching()

            if (user.locked) {
              dispatch('startFetchingFollowRequests')
            }

            if (useMergedConfigStore().mergedConfig.useStreamingApi) {
              dispatch('fetchTimeline', {
                timeline: 'friends',
                sinceId: null,
              })
              dispatch('fetchNotifications', { sinceId: null })
              dispatch('enableMastoSockets', true)
                .catch((error) => {
                  console.error(
                    'Failed initializing MastoAPI Streaming socket',
                    error,
                  )
                })
                .then(() => {
                  dispatch('fetchChats', { latest: true })
                  setTimeout(
                    () => dispatch('setNotificationsSilence', false),
                    10000,
                  )
                })
            } else {
              startPolling()
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
    afterLoad({ lastLoginName }) {
      return { lastLoginName }
    },
  },
})
