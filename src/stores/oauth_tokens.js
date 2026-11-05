import { defineStore } from 'pinia'

import { useOAuthStore } from 'src/stores/oauth.js'

import { fetchOAuthTokens, revokeOAuthToken } from 'src/api/user.js'

/* Just to clear the confusion:
 * OAuth Store is responsible for user authentication
 * OAuth Tokens Store is responsible for *managing* all of the user's tokens,
 * i.e. for current and other clients
 */
export const useOAuthTokensStore = defineStore('oauthTokens', {
  state: () => ({
    tokens: [],
    usTokens: [], // Shouldn't be more than one but just for consistency sake
  }),
  actions: {
    fetchTokens() {
      fetchOAuthTokens({
        credentials: useOAuthStore().token,
      }).then(({ data: tokens }) => {
        this.swapTokens(tokens)
      })
    },
    revokeToken(id) {
      revokeOAuthToken({
        id,
        credentials: useOAuthStore().token,
      }).then(({ status }) => {
        if (status === 201) {
          this.swapTokens([
            ...this.tokens.filter((token) => token.id !== id),
            ...this.usTokens.filter((token) => token.id !== id),
          ])
        }
      })
    },
    swapTokens(tokens) {
      this.tokens = tokens.filter((t) => !t.current)
      this.usTokens = tokens.filter((t) => t.current)
    },
  },
})
