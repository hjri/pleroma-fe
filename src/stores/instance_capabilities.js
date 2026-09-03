import { defineStore } from 'pinia'

import { useShoutStore } from 'src/stores/shout.js'
import { useUsersStore } from 'src/stores/users.js'

const defaultState = {
  postFormats: [],
  mailerEnabled: false,
  safeDM: true,
  shoutAvailable: false,
  pleromaExtensionsAvailable: true,
  pleromaChatMessagesAvailable: false,
  pleromaCustomEmojiReactionsAvailable: false,
  pleromaBookmarkFoldersAvailable: false,
  pleromaPublicFavouritesAvailable: true,
  statusNotificationTypeAvailable: true,
  gopherAvailable: false,
  editingAvailable: false,
  mediaProxyAvailable: false,
  suggestionsEnabled: false,
  suggestionsWeb: '',
  quotingAvailable: false,
  groupActorAvailable: false,
  blockExpiration: false,
  tagPolicyAvailable: false,
  pollsAvailable: false,
  localBubble: false, // Akkoma
  scrobblesSupport: false,
}

export const useInstanceCapabilitiesStore = defineStore(
  'instance-capabilities',
  {
    state: () => ({ ...defaultState }),
    actions: {
      set(capability, value) {
        if (!Object.hasOwn(defaultState, capability)) {
          console.error(
            `Unknown instance capability ${capability}, value: ${value}`,
          )
        }

        this[capability] = value

        if (
          capability === 'shoutAvailable' &&
          useUsersStore().currentUser?.token
        ) {
          useShoutStore().initializeSocket()
        }
      },
    },
  },
)
