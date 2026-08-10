import { set } from 'lodash'
import { defineStore } from 'pinia'

import {
  convertDefinitions,
  INSTANCE_DEFAULT_CONFIG,
  INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
  INSTANCE_IDENTITY_DEFAULT,
  INSTANCE_IDENTITY_DEFAULT_DEFINITIONS,
  LOCAL_DEFAULT_CONFIG,
  LOCAL_DEFAULT_CONFIG_DEFINITIONS,
  validateSetting,
} from '../modules/default_config_state.js'

import { useInterfaceStore } from 'src/stores/interface.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchKnownDomains } from 'src/api/public.js'

const REMOTE_INTERACTION_URL = '/main/ostatus'

const ROOT_STATE_DEFINITIONS = {
  name: {
    type: 'string',
    default: 'PleromaFE',
  },
  registrationOpen: {
    required: true,
    type: 'boolean',
  },
  server: {
    description: 'Server URL',
    required: true,
    type: 'string',
  },
  privateMode: {
    description: 'Private instance?',
    required: true,
    type: 'boolean',
  },
  federating: {
    description: 'Is federation enabled?',
    required: true,
    type: 'boolean',
  },
  federationPolicy: {
    description: '????',
    required: true,
    type: 'object',
  },

  // Indexes of themes/styles/palettes
  themesIndex: {
    required: true,
    type: 'object',
  },
  stylesIndex: {
    required: true,
    type: 'object',
  },
  palettesIndex: {
    required: true,
    type: 'object',
  },

  themeData: {
    description: 'Used for theme v2 editor',
    required: true,
    type: 'object',
  },
  vapidPublicKey: {
    description: 'Used for WebPush',
    required: true,
    type: 'string',
  },

  // Stuff from static/config.json
  loginMethod: {
    description: 'Login method (token/password)',
    default: 'password',
  },
  disableUpdateNotification: {
    description: 'Disable update notification (pleroma-tan one)',
    default: false,
  },
  knownDomains: {
    description: 'List of known domains; used for domain list for domain mutes',
    default: [],
  },

  // Moderation stuff
  staffAccounts: {
    description: 'List of staff accounts',
    default: [],
  },
  accountActivationRequired: {
    description:
      'Account activation (by email or admin) required after registration',
    required: true,
    type: 'boolean',
  },
  accountApprovalRequired: {
    description: 'Admin approval required after registration',
    required: true,
    type: 'boolean',
  },
  birthdayRequired: {
    description: 'Require birthday entry when registering',
    required: true,
    type: 'boolean',
  },
  birthdayMinAge: {
    description: 'Minimum age required for registration',
    default: 0,
  },
  restrictedNicknames: {
    description: 'List of nicknames that are not allowed',
    default: [],
  },
  localBubbleInstances: {
    description: "Akkoma's bubble feature, list of instances",
    default: [],
  }, // Akkoma

  // Version Information
  backendVersion: {
    required: true,
    type: 'string',
  },
  backendRepository: {
    required: true,
    type: 'string',
  },
  frontendVersion: {
    required: true,
    type: 'string',
  },
}
const ROOT_STATE = convertDefinitions(ROOT_STATE_DEFINITIONS)

const DEFAULT_STATE = {
  ...ROOT_STATE,
  // Instance-wide configurations that should not be changed by individual users
  instanceIdentity: {
    ...INSTANCE_IDENTITY_DEFAULT,
  },

  limits: {
    bannerlimit: null,
    avatarlimit: null,
    backgroundlimit: null,
    uploadlimit: null,
    fieldsLimits: null,
    textLimit: null,
    pollLimits: {
      max_options: 4,
      max_option_chars: 255,
      min_expiration: 60,
      max_expiration: 60 * 60 * 24,
    },
  },

  // Instance admins can override default settings for the whole instance
  prefsStorage: {
    ...INSTANCE_DEFAULT_CONFIG,
    ...LOCAL_DEFAULT_CONFIG,
  },
}

export const useInstanceStore = defineStore('instance', {
  state: () => ({ ...DEFAULT_STATE }),
  getters: {
    instanceDomain(state) {
      return new URL(this.server).hostname
    },
  },
  actions: {
    set({ path, value }) {
      let definition
      const pathArray = path.split('.')
      const subpath = pathArray[1] ?? pathArray[0]

      if (path.startsWith('instanceIdentity.')) {
        definition = INSTANCE_IDENTITY_DEFAULT_DEFINITIONS[subpath]
      } else if (path.startsWith('prefsStorage.')) {
        definition = {
          ...LOCAL_DEFAULT_CONFIG_DEFINITIONS,
          ...INSTANCE_DEFAULT_CONFIG_DEFINITIONS,
        }[subpath]
      } else if (path.startsWith('limits.')) {
        definition =
          path === 'limits.pollLimits' || path === 'limits.fieldsLimits'
            ? { required: true, type: 'object' }
            : { required: true, type: 'number' }
      } else {
        const definitions = ROOT_STATE_DEFINITIONS
        definition = definitions[subpath]
      }

      const finalValue = validateSetting({
        path,
        value,
        definition,
        throwError: true,
        defaultState: DEFAULT_STATE,
        validateObjects: false,
      })

      set(this, path, finalValue)

      if (path === 'name') useInterfaceStore().setPageTitle()
    },
    async getKnownDomains() {
      try {
        const { data } = await fetchKnownDomains({
          credentials: useUsersStore().currentUser.credentials,
        })
        this.knownDomains = data
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
