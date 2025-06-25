import { defineStore } from 'pinia'
import { createApp, getClientToken, verifyAppToken } from 'src/services/new_api/oauth.js'

// status codes about verifyAppToken (GET /api/v1/apps/verify_credentials)
const isAppTokenRejected = error => (
  // Pleroma API docs say it returns 422 when unauthorized
  error.statusCode === 422 ||
  // but it actually returns 400 (as of 2.9.0)
  // NOTE: don't try to match against the error message, it is translatable
  error.statusCode === 400 ||
  // and Mastodon docs say it returns 401
  error.statusCode === 401
)

// status codes about getAppToken (GET /oauth/token)
const isClientDataRejected = error => (
  // Mastodon docs say it returns 401
  error.statusCode === 401 ||
  // but Pleroma actually returns 400 (as of 2.9.0)
  // NOTE: don't try to match against the error message, it is translatable
  error.statusCode === 400
)

export const useOAuthStore = defineStore('oauth', {
  state: () => ({
    clientId: false,
    clientSecret: false,
    /* App token is authentication for app without any user, used mostly for
     * MastoAPI's registration of new users, stored so that we can fall back to
     * it on logout
     */
    appToken: false,
    /* User token is authentication for app with user, this is for every calls
     * that need authorized user to be successful (i.e. posting, liking etc)
     */
    userToken: false
  }),
  getters: {
    getToken () {
      return this.userToken || this.appToken
    },
    getUserToken () {
      return this.userToken
    }
  },
  actions: {
    setClientData ({ clientId, clientSecret }) {
      this.clientId = clientId
      this.clientSecret = clientSecret
    },
    setAppToken (token) {
      this.appToken = token
    },
    setToken (token) {
      this.userToken = token
    },
    clearToken () {
      this.userToken = false
    },
    async createApp () {
      const { state } = window.vuex
      const instance = state.instance.server
      const app = await createApp(instance)
      this.setClientData(app)
      return app
    },
    /// Use this if you want to get the client id and secret but are not interested
    /// in whether they are valid.
    /// @return {{ clientId: string, clientSecret: string }} An object representing the app
    async ensureApp () {
      if (this.clientId && this.clientSecret) {
        return {
          clientId: this.clientId,
          clientSecret: this.clientSecret
        }
      } else {
        return this.createApp()
      }
    },
    async getAppToken () {
      const { state } = window.vuex
      const instance = state.instance.server
      const res = await getClientToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        instance
      })
      this.setAppToken(res.access_token)
      return res.access_token
    },
    /// Use this if you want to ensure the app is still valid to use.
    /// @return {string} The access token to the app (not attached to any user)
    async ensureAppToken () {
      const { state } = window.vuex
      if (this.appToken) {
        try {
          await verifyAppToken({
            instance: state.instance.server,
            appToken: this.appToken
          })
          return this.appToken
        } catch (e) {
          if (!isAppTokenRejected(e)) {
            // The server did not reject our token, but we encountered other problems. Maybe the server is down.
            throw e
          } else {
            // The app token is rejected, so it is no longer useful.
            this.setAppToken(false)
          }
        }
      }

      // appToken is not available, or is rejected: try to get a new one.
      // First, make sure the client id and client secret are filled.
      try {
        await this.ensureApp()
      } catch (e) {
        console.error('Cannot create app', e)
        throw e
      }

      // Note that at this step, the client id and secret may be invalid
      // (because the backend may have already deleted the app due to no user login)
      try {
        return await this.getAppToken()
      } catch (e) {
        if (!isClientDataRejected(e)) {
          // Non-credentials problem, fail fast
          console.error('Cannot get app token', e)
          throw e
        } else {
          // the client id and secret are invalid, so we should clear them
          // and re-create our app
          this.setClientData({
            clientId: false,
            clientSecret: false
          })
          await this.createApp()
          // try once again to get the token
          return await this.getAppToken()
        }
      }
    }
  },
  persist: {
    afterLoad (state) {
      // state.token is userToken with older name, coming from persistent state
      if (state.token && !state.userToken) {
        state.userToken = state.token
      }
      if ('token' in state) {
        delete state.token
      }
      return state
    }
  }
})
