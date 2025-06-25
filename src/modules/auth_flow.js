import { useOAuthStore } from 'src/stores/oauth.js'

const PASSWORD_STRATEGY = 'password'
const TOKEN_STRATEGY = 'token'

// MFA strategies
const TOTP_STRATEGY = 'totp'
const RECOVERY_STRATEGY = 'recovery'

// initial state
const state = {
  settings: {},
  strategy: PASSWORD_STRATEGY,
  initStrategy: PASSWORD_STRATEGY // default strategy from config
}

const resetState = (state) => {
  state.strategy = state.initStrategy
  state.settings = {}
}

// getters
const getters = {
  settings: (state) => {
    return state.settings
  },
  requiredPassword: (state) => {
    return state.strategy === PASSWORD_STRATEGY
  },
  requiredToken: (state) => {
    return state.strategy === TOKEN_STRATEGY
  },
  requiredTOTP: (state) => {
    return state.strategy === TOTP_STRATEGY
  },
  requiredRecovery: (state) => {
    return state.strategy === RECOVERY_STRATEGY
  }
}

// mutations
const mutations = {
  setInitialStrategy (state, strategy) {
    if (strategy) {
      state.initStrategy = strategy
      state.strategy = strategy
    }
  },
  requirePassword (state) {
    state.strategy = PASSWORD_STRATEGY
  },
  requireToken (state) {
    state.strategy = TOKEN_STRATEGY
  },
  requireMFA (state, { settings }) {
    state.settings = settings
    state.strategy = TOTP_STRATEGY // default strategy of MFA
  },
  requireRecovery (state) {
    state.strategy = RECOVERY_STRATEGY
  },
  requireTOTP (state) {
    state.strategy = TOTP_STRATEGY
  },
  abortMFA (state) {
    resetState(state)
  }
}

// actions
const actions = {

  async login ({ state, dispatch }, { access_token: accessToken }) {
    useOAuthStore().setToken(accessToken)
    await dispatch('loginUser', accessToken, { root: true })
    resetState(state)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
