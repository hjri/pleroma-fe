import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

const PASSWORD_STRATEGY = 'password'
const TOKEN_STRATEGY = 'token'

// MFA strategies
const TOTP_STRATEGY = 'totp'
const RECOVERY_STRATEGY = 'recovery'

export const useAuthFlowStore = defineStore('authFlow', {
  // initial state
  state: () => ({
    settings: {},
    strategy: PASSWORD_STRATEGY,
    initStrategy: PASSWORD_STRATEGY, // default strategy from config
  }),
  // getters
  getters: {
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
    },
  },
  actions: {
    setInitialStrategy(strategy) {
      if (strategy) {
        this.initStrategy = strategy
        this.strategy = strategy
      }
    },
    requirePassword() {
      this.strategy = PASSWORD_STRATEGY
    },
    requireToken() {
      this.strategy = TOKEN_STRATEGY
    },
    requireMFA({ settings }) {
      this.settings = settings
      this.strategy = TOTP_STRATEGY // default strategy of MFA
    },
    requireRecovery() {
      this.strategy = RECOVERY_STRATEGY
    },
    requireTOTP() {
      this.strategy = TOTP_STRATEGY
    },
    abortMFA() {
      this.resetState()
    },
    resetState() {
      this.strategy = this.initStrategy
      this.settings = {}
    },
    async login({ access_token: accessToken }) {
      useOAuthStore().setToken(accessToken)
      await window.vuex.dispatch('loginUser', accessToken, { root: true })
      this.resetState()
    },
  },
})
