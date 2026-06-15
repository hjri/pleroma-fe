import { defineStore } from 'pinia'

import { useCredentialsStore } from 'src/stores/credentials.js'

import {
  fetchOAuthTokens,
  revokeOAuthToken,
} from 'src/services/api/api.service.js'

export const useOAuthTokensStore = defineStore('oauthTokens', {
  state: () => ({
    tokens: [],
  }),
  actions: {
    fetchTokens() {
      fetchOAuthTokens({
        credentials: useCredentialsStore().current,
      }).then((tokens) => {
        this.swapTokens(tokens)
      })
    },
    revokeToken(id) {
      revokeOAuthToken({
        id,
        credentials: useCredentialsStore().current,
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
