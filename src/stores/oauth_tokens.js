import { defineStore } from 'pinia'

export const useOAuthTokensStore = defineStore('oauthTokens', {
  state: () => ({
    tokens: []
  }),
  actions: {
    fetchTokens () {
      window.vuex.state.api.backendInteractor.fetchOAuthTokens().then((tokens) => {
        this.swapTokens(tokens)
      })
    },
    revokeToken (id) {
      window.vuex.state.api.backendInteractor.revokeOAuthToken({ id }).then((response) => {
        if (response.status === 201) {
          this.swapTokens(this.tokens.filter(token => token.id !== id))
        }
      })
    },
    swapTokens (tokens) {
      this.tokens = tokens
    }
  }
});