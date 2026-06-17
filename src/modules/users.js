import {
  compact,
  concat,
  each,
  isArray,
  last,
  map,
  mergeWith,
  uniq,
} from 'lodash'

import { register } from '../services/api/public.js'
import oauthApi from '../services/new_api/oauth.js'
import {
  registerPushNotifications,
  unregisterPushNotifications,
} from '../services/sw/sw.js'
import {
  windowHeight,
  windowWidth,
} from '../services/window_utils/window_utils'

import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'
import { useEmojiStore } from 'src/stores/emoji.js'
import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useListsStore } from 'src/stores/lists.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'

import {
  fetchFollowers,
  fetchFriends,
  fetchUser,
  fetchUserByName,
  getCaptcha,
  searchUsers,
  verifyCredentials,
} from 'src/services/api/public.js'
import {
  fetchBlocks,
  fetchDomainMutes,
  fetchMutes,
  fetchUserInLists,
  fetchUserRelationship,
  followUser,
  muteUser,
} from 'src/services/api/user.js'

// TODO: Unify with mergeOrAdd in statuses.js
export const mergeOrAdd = (arr, obj, item) => {
  if (!item) {
    return false
  }
  const oldItem = obj[item.id]
  if (oldItem) {
    // We already have this, so only merge the new info.
    mergeWith(oldItem, item, mergeArrayLength)
    return { item: oldItem, new: false }
  } else {
    // This is a new item, prepare it
    arr.push(item)
    obj[item.id] = item
    return { item, new: true }
  }
}

const mergeArrayLength = (oldValue, newValue) => {
  if (isArray(oldValue) && isArray(newValue)) {
    oldValue.length = newValue.length
    return mergeWith(oldValue, newValue, mergeArrayLength)
  }
}

const getNotificationPermission = () => {
  const Notification = window.Notification

  if (!Notification) return Promise.resolve(null)
  if (Notification.permission === 'default')
    return Notification.requestPermission()
  return Promise.resolve(Notification.permission)
}

const blockUser = (store, args) => {
  const id = args.id
  const expiresIn = typeof args === 'object' ? args.expiresIn : 0

  const predictedRelationship = store.state.relationships[id] || { id }
  store.commit('updateUserRelationship', [predictedRelationship])
  store.commit('addBlockId', id)

  return blockUser({ id, expiresIn }).then((relationship) => {
    store.commit('updateUserRelationship', [relationship])
    store.commit('addBlockId', id)

    store.commit('removeStatus', { timeline: 'friends', userId: id })
    store.commit('removeStatus', { timeline: 'public', userId: id })
    store.commit('removeStatus', {
      timeline: 'publicAndExternal',
      userId: id,
    })
  })
}

const unblockUser = (store, id) => {
  return unblockUser({ id }).then((relationship) =>
    store.commit('updateUserRelationship', [relationship]),
  )
}

const removeUserFromFollowers = (store, id) => {
  return removeUserFromFollowers({ id }).then((relationship) =>
    store.commit('updateUserRelationship', [relationship]),
  )
}

const editUserNote = (store, { id, comment }) => {
  return editUserNote({ id, comment }).then((relationship) =>
    store.commit('updateUserRelationship', [relationship]),
  )
}

const localMuteUser = (store, args) => {
  const id = typeof args === 'object' ? args.id : args
  const expiresIn = typeof args === 'object' ? args.expiresIn : 0

  const predictedRelationship = store.state.relationships[id] || { id }
  store.commit('updateUserRelationship', [predictedRelationship])
  store.commit('addMuteId', id)

  return muteUser({
    id,
    expiresIn,
    credentials: useOAuthStore().token,
  }).then((relationship) => {
    store.commit('updateUserRelationship', [relationship])
    store.commit('addMuteId', id)
  })
}

const unmuteUser = (store, id) => {
  const predictedRelationship = store.state.relationships[id] || { id }
  predictedRelationship.muting = false
  store.commit('updateUserRelationship', [predictedRelationship])

  return unmuteUser({ id }).then((relationship) =>
    store.commit('updateUserRelationship', [relationship]),
  )
}

const hideReblogs = (store, userId) => {
  return followUser({
    id: userId,
    reblogs: false,
    credentials: useOAuthStore().token,
  }).then((relationship) => {
    store.commit('updateUserRelationship', [relationship])
  })
}

const showReblogs = (store, userId) => {
  return followUser({
    id: userId,
    reblogs: true,
    credentials: useOAuthStore().token,
  }).then((relationship) =>
    store.commit('updateUserRelationship', [relationship]),
  )
}

const muteDomain = (store, domain) => {
  return muteDomain({
    domain,
    credentials: useOAuthStore().token,
  }).then(() => store.commit('addDomainMute', domain))
}

const unmuteDomain = (store, domain) => {
  return unmuteDomain({
    domain,
    credentials: useOAuthStore().token,
  }).then(() => store.commit('removeDomainMute', domain))
}

export const mutations = {
  tagUser(state, { user: { id }, tag }) {
    const user = state.usersObject[id]
    user.tags.add(tag)
  },
  untagUser(state, { user: { id }, tag }) {
    const user = state.usersObject[id]
    user.tags.delete(tag)
  },
  updateRight(state, { user: { id }, right, value }) {
    const user = state.usersObject[id]
    const newRights = user.rights
    newRights[right] = value
    user.rights = newRights
  },
  updateUserAdminData(state, { user }) {
    const { id } = user
    const localUser = state.usersObject[id]
    localUser.adminData = user
    localUser.deactivated = !user.is_active
    localUser.tags = new Set(user.tags)
  },
  setCurrentUser(state, user) {
    state.lastLoginName = user.screen_name
    state.currentUser = mergeWith(
      state.currentUser || {},
      user,
      mergeArrayLength,
    )
  },
  clearCurrentUser(state) {
    state.currentUser = false
    state.lastLoginName = false
  },
  beginLogin(state) {
    state.loggingIn = true
  },
  endLogin(state) {
    state.loggingIn = false
  },
  saveFriendIds(state, { id, friendIds }) {
    const user = state.usersObject[id]
    user.friendIds = uniq(concat(user.friendIds || [], friendIds))
  },
  saveFollowerIds(state, { id, followerIds }) {
    const user = state.usersObject[id]
    user.followerIds = uniq(concat(user.followerIds || [], followerIds))
  },
  // Because frontend doesn't have a reason to keep these stuff in memory
  // outside of viewing someones user profile.
  clearFriends(state, userId) {
    const user = state.usersObject[userId]
    if (user) {
      user.friendIds = []
    }
  },
  clearFollowers(state, userId) {
    const user = state.usersObject[userId]
    if (user) {
      user.followerIds = []
    }
  },
  addNewUsers(state, users) {
    each(users, (user) => {
      if (user.relationship) {
        state.relationships[user.relationship.id] = user.relationship
      }
      const res = mergeOrAdd(state.users, state.usersObject, user)
      const item = res.item
      if (res.new && item.screen_name && !item.screen_name.includes('@')) {
        state.usersByNameObject[item.screen_name.toLowerCase()] = item
      }
    })
  },
  updateUserRelationship(state, relationships) {
    relationships.forEach((relationship) => {
      state.relationships[relationship.id] = relationship
    })
  },
  updateUserInLists(state, { id, inLists }) {
    state.usersObject[id].inLists = inLists
  },
  saveBlockIds(state, blockIds) {
    state.currentUser.blockIds = blockIds
  },
  addBlockId(state, blockId) {
    if (state.currentUser.blockIds.indexOf(blockId) === -1) {
      state.currentUser.blockIds.push(blockId)
    }
  },
  setBlockIdsMaxId(state, blockIdsMaxId) {
    state.currentUser.blockIdsMaxId = blockIdsMaxId
  },
  saveMuteIds(state, muteIds) {
    state.currentUser.muteIds = muteIds
  },
  setMuteIdsMaxId(state, muteIdsMaxId) {
    state.currentUser.muteIdsMaxId = muteIdsMaxId
  },
  addMuteId(state, muteId) {
    if (state.currentUser.muteIds.indexOf(muteId) === -1) {
      state.currentUser.muteIds.push(muteId)
    }
  },
  saveDomainMutes(state, domainMutes) {
    state.currentUser.domainMutes = domainMutes
  },
  addDomainMute(state, domain) {
    if (state.currentUser.domainMutes.indexOf(domain) === -1) {
      state.currentUser.domainMutes.push(domain)
    }
  },
  removeDomainMute(state, domain) {
    const index = state.currentUser.domainMutes.indexOf(domain)
    if (index !== -1) {
      state.currentUser.domainMutes.splice(index, 1)
    }
  },
  setPinnedToUser(state, status) {
    const user = state.usersObject[status.user.id]
    user.pinnedStatusIds = user.pinnedStatusIds || []
    const index = user.pinnedStatusIds.indexOf(status.id)

    if (status.pinned && index === -1) {
      user.pinnedStatusIds.push(status.id)
    } else if (!status.pinned && index !== -1) {
      user.pinnedStatusIds.splice(index, 1)
    }
  },
  setUserForStatus(state, status) {
    status.user = state.usersObject[status.user.id]
  },
  setUserForNotification(state, notification) {
    if (notification.type !== 'follow') {
      notification.action.user = state.usersObject[notification.action.user.id]
    }
    notification.from_profile = state.usersObject[notification.from_profile.id]
  },
  setColor(state, { user: { id }, highlighted }) {
    const user = state.usersObject[id]
    user.highlight = highlighted
  },
  signUpPending(state) {
    state.signUpPending = true
    state.signUpErrors = []
    state.signUpNotice = {}
  },
  signUpSuccess(state) {
    state.signUpPending = false
  },
  signUpFailure(state, errors) {
    state.signUpPending = false
    state.signUpErrors = errors
    state.signUpNotice = {}
  },
  signUpNotice(state, notice) {
    state.signUpPending = false
    state.signUpErrors = []
    state.signUpNotice = notice
  },
}

export const getters = {
  findUser: (state) => (query) => {
    return state.usersObject[query]
  },
  findUserByName: (state) => (query) => {
    return state.usersByNameObject[query.toLowerCase()]
  },
  findUserByUrl: (state) => (query) => {
    return state.users.find(
      (u) =>
        u.statusnet_profile_url &&
        u.statusnet_profile_url.toLowerCase() === query.toLowerCase(),
    )
  },
  relationship: (state) => (id) => {
    const rel = id && state.relationships[id]
    return rel || { id, loading: true }
  },
}

export const defaultState = {
  loggingIn: false,
  lastLoginName: false,
  currentUser: false,
  users: [],
  usersObject: {},
  usersByNameObject: {},
  signUpPending: false,
  signUpErrors: [],
  signUpNotice: {},
  relationships: {},
}

const users = {
  state: defaultState,
  mutations,
  getters,
  actions: {
    fetchUserIfMissing(store, id) {
      const user = store.getters.findUser(id)
      if (!user) {
        return store.dispatch('fetchUser', id)
      } else {
        return Promise.resolve(user)
      }
    },
    updateUserAdminData(store, { userAdminData }) {
      return store
        .dispatch('fetchUserIfMissing', userAdminData.id)
        .then((user) => {
          user.adminData = userAdminData
          store.commit('addNewUsers', [user])
          return user
        })
    },
    fetchUser(store, id) {
      return fetchUser({
        id,
        credentials: useOAuthStore().token,
      }).then((user) => {
        store.commit('addNewUsers', [user])
        return user
      })
    },
    fetchUserByName(store, name) {
      return fetchUserByName({
        name,
        credentials: useOAuthStore().token,
      }).then((user) => {
        store.commit('addNewUsers', [user])
        return user
      })
    },
    fetchUserRelationship(store, id) {
      if (store.state.currentUser) {
        fetchUserRelationship({
          id,
          credentials: useOAuthStore().token,
        }).then((relationships) =>
          store.commit('updateUserRelationship', relationships),
        )
      }
    },
    fetchUserInLists(store, id) {
      if (store.state.currentUser) {
        fetchUserInLists({
          id,
          credentials: useOAuthStore().token,
        }).then((inLists) => store.commit('updateUserInLists', { id, inLists }))
      }
    },
    fetchBlocks(store, args) {
      const { reset } = args || {}

      const maxId = store.state.currentUser.blockIdsMaxId
      return fetchBlocks({
        maxId,
        credentials: useOAuthStore().token,
      }).then((blocks) => {
        if (reset) {
          store.commit('saveBlockIds', map(blocks, 'id'))
        } else {
          map(blocks, 'id').map((id) => store.commit('addBlockId', id))
        }
        if (blocks.length) {
          store.commit('setBlockIdsMaxId', last(blocks).id)
        }
        store.commit('addNewUsers', blocks)
        return blocks
      })
    },
    blockUser(store, data) {
      return blockUser(store, data)
    },
    unblockUser(store, data) {
      return unblockUser(store, data)
    },
    removeUserFromFollowers(store, id) {
      return removeUserFromFollowers(store, id)
    },
    blockUsers(store, data = []) {
      return Promise.all(data.map((d) => blockUser(store, d)))
    },
    unblockUsers(store, data = []) {
      return Promise.all(data.map((d) => unblockUser(store, d)))
    },
    editUserNote(store, args) {
      return editUserNote(store, args)
    },
    fetchMutes(store, args) {
      const { reset } = args || {}

      const maxId = store.state.currentUser.muteIdsMaxId
      return fetchMutes({
        maxId,
        credentials: useOAuthStore().token,
      }).then((mutes) => {
        if (reset) {
          store.commit('saveMuteIds', map(mutes, 'id'))
        } else {
          map(mutes, 'id').map((id) => store.commit('addMuteId', id))
        }
        if (mutes.length) {
          store.commit('setMuteIdsMaxId', last(mutes).id)
        }
        store.commit('addNewUsers', mutes)
        return mutes
      })
    },
    muteUser(store, data) {
      return localMuteUser(store, data)
    },
    unmuteUser(store, id) {
      return unmuteUser(store, id)
    },
    hideReblogs(store, id) {
      return hideReblogs(store, id)
    },
    showReblogs(store, id) {
      return showReblogs(store, id)
    },
    muteUsers(store, data = []) {
      return Promise.all(data.map((d) => localMuteUser(store, d)))
    },
    unmuteUsers(store, ids = []) {
      return Promise.all(ids.map((d) => unmuteUser(store, d)))
    },
    fetchDomainMutes(store) {
      return fetchDomainMutes({
        credentials: useOAuthStore().token,
      }).then((domainMutes) => {
        store.commit('saveDomainMutes', domainMutes)
        return domainMutes
      })
    },
    muteDomain(store, domain) {
      return muteDomain(store, domain)
    },
    unmuteDomain(store, domain) {
      return unmuteDomain(store, domain)
    },
    muteDomains(store, domains = []) {
      return Promise.all(domains.map((domain) => muteDomain(store, domain)))
    },
    unmuteDomains(store, domain = []) {
      return Promise.all(domain.map((domain) => unmuteDomain(store, domain)))
    },
    fetchFriends({ rootState, commit }, id) {
      const user = rootState.users.usersObject[id]
      const maxId = last(user.friendIds)
      return fetchFriends({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then((friends) => {
        commit('addNewUsers', friends)
        commit('saveFriendIds', { id, friendIds: map(friends, 'id') })
        return friends
      })
    },
    fetchFollowers({ rootState, commit }, id) {
      const user = rootState.users.usersObject[id]
      const maxId = last(user.followerIds)
      return fetchFollowers({
        id,
        maxId,
        credentials: useOAuthStore().token,
      }).then((followers) => {
        commit('addNewUsers', followers)
        commit('saveFollowerIds', { id, followerIds: map(followers, 'id') })
        return followers
      })
    },
    clearFriends({ commit }, userId) {
      commit('clearFriends', userId)
    },
    clearFollowers({ commit }, userId) {
      commit('clearFollowers', userId)
    },
    subscribeUser({ rootState, commit }, id) {
      return followUser({
        id,
        notify: true,
        credentials: useOAuthStore().token,
      }).then((relationship) =>
        commit('updateUserRelationship', [relationship]),
      )
    },
    unsubscribeUser({ rootState, commit }, id) {
      return followUser({
        id,
        notify: false,
        credentials: useOAuthStore().token,
      }).then((relationship) =>
        commit('updateUserRelationship', [relationship]),
      )
    },
    registerPushNotifications(store) {
      const token = store.state.currentUser.credentials
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
    unregisterPushNotifications(store) {
      const token = store.state.currentUser.credentials

      unregisterPushNotifications(token)
    },
    addNewUsers({ commit }, users) {
      commit('addNewUsers', users)
    },
    addNewStatuses(store, { statuses }) {
      const users = map(statuses, 'user')
      const retweetedUsers = compact(map(statuses, 'retweeted_status.user'))
      store.commit('addNewUsers', users)
      store.commit('addNewUsers', retweetedUsers)

      each(statuses, (status) => {
        // Reconnect users to statuses
        store.commit('setUserForStatus', status)
        // Set pinned statuses to user
        store.commit('setPinnedToUser', status)
      })
      each(compact(map(statuses, 'retweeted_status')), (status) => {
        // Reconnect users to retweets
        store.commit('setUserForStatus', status)
        // Set pinned retweets to user
        store.commit('setPinnedToUser', status)
      })
    },
    addNewNotifications(store, { notifications }) {
      const users = map(notifications, 'from_profile')
      const targetUsers = map(notifications, 'target').filter((_) => _)
      const notificationIds = notifications.map((_) => _.id)
      store.commit('addNewUsers', users)
      store.commit('addNewUsers', targetUsers)

      const notificationsObject = store.rootState.notifications.idStore
      const relevantNotifications = Object.entries(notificationsObject)
        .filter(([k]) => notificationIds.includes(k))
        .map(([, val]) => val)

      // Reconnect users to notifications
      each(relevantNotifications, (notification) => {
        store.commit('setUserForNotification', notification)
      })
    },
    searchUsers({ rootState, commit }, { query }) {
      return searchUsers({
        query,
        credentials: useOAuthStore().token,
      }).then((users) => {
        commit('addNewUsers', users)
        return users
      })
    },
    async signUp(store, userInfo) {
      const oauthStore = useOAuthStore()
      store.commit('signUpPending')

      try {
        const token = await oauthStore.ensureAppToken()
        const data = await register({
          credentials: token,
          params: { ...userInfo },
        })

        if (data.access_token) {
          store.commit('signUpSuccess')
          oauthStore.setToken(data.access_token)
          await store.dispatch('loginUser', data.access_token)
          return 'ok'
        } else {
          // Request succeeded, but user cannot login yet.
          store.commit('signUpNotice', data)
          return 'request_sent'
        }
      } catch (e) {
        const errors = e.message
        store.commit('signUpFailure', errors)
        throw e
      }
    },
    getCaptcha(store) {
      return getCaptcha({
        credentials: useOAuthStore().token,
      })
    },

    logout(store) {
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

          return oauthApi.revokeToken(params)
        })
        .then(() => {
          store.commit('clearCurrentUser')
          store.dispatch('disconnectFromSocket')
          oauth.clearToken()
          store.dispatch('stopFetchingTimeline', 'friends')
          store.dispatch('stopFetchingNotifications')
          useListsStore().stopFetching()
          useBookmarkFoldersStore().stopFetching()
          store.dispatch('stopFetchingFollowRequests')
          store.commit('clearNotifications')
          store.commit('resetStatuses')
          store.dispatch('resetChats')
          useInterfaceStore().setLastTimeline('public-timeline')
          useInterfaceStore().setLayoutWidth(windowWidth())
          useInterfaceStore().setLayoutHeight(windowHeight())
        })
    },
    loginUser(store, accessToken) {
      return new Promise((resolve, reject) => {
        const commit = store.commit
        const dispatch = store.dispatch

        commit('beginLogin')

        verifyCredentials({
          credentials: useOAuthStore().token,
        })
          .then((data) => {
            if (!data.error) {
              const user = data
              // user.credentials = userCredentials
              user.credentials = accessToken
              user.blockIds = []
              user.muteIds = []
              user.domainMutes = []
              commit('setCurrentUser', user)

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
              commit('addNewUsers', [user])

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

                if (
                  useInstanceCapabilitiesStore().pleromaChatMessagesAvailable
                ) {
                  // Start fetching chats
                  dispatch('startFetchingChats')
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

              // Get user mutes
              dispatch('fetchMutes')

              useInterfaceStore().setLayoutWidth(windowWidth())
              useInterfaceStore().setLayoutHeight(windowHeight())

              // Fetch our friends
              fetchFriends({ id: user.id }).then((friends) =>
                commit('addNewUsers', friends),
              )
            } else {
              const response = data.error
              // Authentication failed
              commit('endLogin')

              // remove authentication token on client/authentication errors
              if ([400, 401, 403, 422].includes(response.status)) {
                useOAuthStore().clearToken()
              }

              if (response.status === 401) {
                reject(new Error('Wrong username or password'))
              } else {
                reject(new Error('An error occurred, please try again'))
              }
            }
            commit('endLogin')
            resolve()
          })
          .catch((error) => {
            console.error(error)
            commit('endLogin')
            reject(new Error('Failed to connect to server, try again'))
          })
      })
    },
  },
}

export default users
