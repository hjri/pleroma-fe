import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchOAuthTokens, revokeOAuthToken } from 'src/services/api/user.js'

export const useOAuthTokensStore = defineStore('oauthTokens', {
  state: () => ({
    tokens: [],
  }),
  actions: {
    fetchTokens() {
      fetchOAuthTokens({
        credentials: useOAuthStore().token,
      }).then((tokens) => {
        this.swapTokens(tokens)
      })
    },
    revokeToken(id) {
      revokeOAuthToken({
        id,
        credentials: useOAuthStore().token,
      }).then((response) => {
        if (response.status === 201) {
          this.swapTokens(this.tokens.filter((token) => token.id !== id))
        }
      })
    },
    swapTokens(tokens) {
      this.tokens = tokens
    },
  },
})
