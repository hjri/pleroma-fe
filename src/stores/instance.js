import { get, set } from 'lodash'
import { defineStore } from 'pinia'

import { ensureFinalFallback } from 'src/i18n/languages.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { instanceDefaultProperties } from '../modules/config.js'
import {
  instanceDefaultConfig,
  staticOrApiConfigDefault,
} from '../modules/default_config_state.js'
import apiService from '../services/api/api.service.js'

const REMOTE_INTERACTION_URL = '/main/ostatus'

const defaultState = {
  // Stuff from apiConfig
  name: 'Pleroma FE',
  registrationOpen: true,
  server: 'http://localhost:4040/',
  textlimit: 5000,
  private: false,
  federating: true,
  federationPolicy: null,
  themesIndex: null,
  stylesIndex: null,
  palettesIndex: null,
  themeData: null, // used for theme editor v2
  vapidPublicKey: null,

  // Stuff from static/config.json
  loginMethod: 'password',
  disableUpdateNotification: false,

  // Instance-wide configurations that should not be changed by individual users
  instanceIdentity: {
    ...staticOrApiConfigDefault,
  },

  limits: {
    bannerlimit: null,
    avatarlimit: null,
    backgroundlimit: null,
    uploadlimit: null,
    fieldsLimits: null,
    pollLimits: {
      max_options: 4,
      max_option_chars: 255,
      min_expiration: 60,
      max_expiration: 60 * 60 * 24,
    },
  },

  // Instance admins can override default settings for the whole instance
  prefsStorage: {
    ...instanceDefaultConfig,
  },

  // Known domains list for user's domain-muting
  knownDomains: [],

  // Moderation stuff
  staffAccounts: [],
  accountActivationRequired: null,
  accountApprovalRequired: null,
  birthdayRequired: false,
  birthdayMinAge: 0,
  restrictedNicknames: [],
  localBubbleInstances: [], // Akkoma

  // Feature-set, apparently, not everything here is reported...
  featureSet: {
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
  },

  // Html stuff
  instanceSpecificPanelContent: '',
  tos: '',

  // Version Information
  backendVersion: '',
  backendRepository: '',
  frontendVersion: '',
}

export const useInstanceStore = defineStore('instance', {
  state: () => ({ ...defaultState }),
  getters: {
    instanceDefaultConfig(state) {
      return instanceDefaultProperties
        .map((key) => [key, state[key]])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    },
    instanceDomain(state) {
      return new URL(this.server).hostname
    },
  },
  actions: {
    set({ path, name, value }) {
      if (get(defaultState, path ?? name) === undefined)
        console.error(
          `Unknown instance option ${path ?? name}, value: ${value}`,
        )
      set(this, path ?? name, value)
      switch (name) {
        case 'name':
          useInterfaceStore().setPageTitle()
          break
        case 'shoutAvailable':
          if (value) {
            window.vuex.dispatch('initializeSocket')
          }
          break
      }
    },
    async getKnownDomains() {
      try {
        this.knownDomains = await apiService.fetchKnownDomains({
          credentials: window.vuex.state.users.currentUser.credentials,
        })
      } catch (e) {
        console.warn("Can't load known domains\n", e)
      }
    },
    getRemoteInteractionLink({ statusId, nickname }) {
      const server = this.server.endsWith('/')
        ? this.server.slice(0, -1)
        : this.server
      const link = server + REMOTE_INTERACTION_URL

      if (statusId) {
        return `${link}?status_id=${statusId}`
      } else {
        return `${link}?nickname=${nickname}`
      }
    },
  },
})
