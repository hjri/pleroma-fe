import { get, set } from 'lodash'
import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'
import { useUsersStore } from 'src/stores/users.js'

import { updateNotificationSettings, updateProfileJSON } from 'src/api/user.js'

const defaultApi = async ({ path, value }) => {
  const params = {}
  set(params, path, value)

  return await updateProfileJSON({
    params,
    credentials: useOAuthStore().token,
  })
}

const notificationsApi = async ({ path, value, oldValue }) => {
  const settings = {}
  set(settings, path, value)

  const result = await updateNotificationSettings({
    settings,
    credentials: useOAuthStore().token,
  })

  if (result.data.status === 'success') {
    // a bit of a hack
    return { ...result, success: true }
  } else {
    throw new Error('Failed updating notification settings', result)
  }
}

/**
 * Map that stores relation between path for reading (from user profile),
 * for writing (into API) an what API to use.
 *
 * Shorthand - instead of { get, set, api? } object it's possible to use string
 * in case default api is used and get = set
 *
 * If no api is specified, defaultApi is used (see above)
 */
export const settingsMap = {
  defaultScope: 'source.privacy',
  defaultNSFW: 'source.sensitive', // BROKEN: pleroma/pleroma#2837
  stripRichContent: {
    get: 'source.pleroma.no_rich_text',
    set: 'no_rich_text',
  },
  // Privacy
  locked: 'locked',
  acceptChatMessages: {
    get: 'pleroma.accepts_chat_messages',
    set: 'accepts_chat_messages',
  },
  allowFollowingMove: {
    get: 'pleroma.allow_following_move',
    set: 'allow_following_move',
  },
  discoverable: {
    get: 'source.pleroma.discoverable',
    set: 'discoverable',
  },
  hideFavorites: {
    get: 'pleroma.hide_favorites',
    set: 'hide_favorites',
  },
  hideFollowers: {
    get: 'pleroma.hide_followers',
    set: 'hide_followers',
  },
  hideFollows: {
    get: 'pleroma.hide_follows',
    set: 'hide_follows',
  },
  hideFollowersCount: {
    get: 'pleroma.hide_followers_count',
    set: 'hide_followers_count',
  },
  hideFollowsCount: {
    get: 'pleroma.hide_follows_count',
    set: 'hide_follows_count',
  },
  // NotificationSettingsAPIs
  webPushHideContents: {
    get: 'pleroma.notification_settings.hide_notification_contents',
    set: 'hideNotificationContents',
    api: notificationsApi,
  },
  blockNotificationsFromStrangers: {
    get: 'pleroma.notification_settings.block_from_strangers',
    set: 'blockFromStrangers',
    api: notificationsApi,
  },
}

export const defaultState = () => ({
  config: Object.fromEntries(Object.keys(settingsMap).map((key) => [key, null]))
})

export const useProfileConfigStore = defineStore('profileConfig', {
  state: defaultState,
  actions: {
    confirmProfileOption({ name, value }) {
      set(this.config, name, value)
    },
    // Set the settings based on their path location
    async setProfileOption({ name, value }) {
      const oldValue = get(this, name)
      const map = settingsMap[name]

      if (!map) throw new Error('Invalid server-side setting')
      const { set: path = map, api = defaultApi } = map
      set(this.config, name, null)

      try {
        const result = await api({ path, value, oldValue })
        const { success } = result
        if (success) {
          set(this.config, name, value)
          return
        }

        useUsersStore().addNewUsers(result)
        this.update(user)
      } catch (e) {
        console.warn('Error setting server-side option:', e)

        set(this.config, name, oldValue)
      }
    },
    update(user) {
      Object.entries(settingsMap).forEach((map) => {
        const [name, value] = map
        const { get: path = value } = value
        set(this.config, name, get(user._original, path))
      })
    },
    onLogin(user) {
      this.update(user)
    },
    onLogout() {
      Object.keys(settingsMap).forEach((key) => {
        set(this.config, key, null)
      })
    },
  },
})
