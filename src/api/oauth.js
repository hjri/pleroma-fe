import { reduce } from 'lodash'

import { paramsString, promisedRequest } from './helpers.js'

import { StatusCodeError } from 'src/services/errors/errors.js'

const REDIRECT_URI = `${window.location.origin}/oauth-callback`
const MASTODON_APP_VERIFY_URL = '/api/v1/apps/verify_credentials'

export const createApp = () => {
  const formData = new window.FormData()

  formData.append('client_name', 'PleromaFE')
  formData.append('website', 'https://pleroma.social')
  formData.append('redirect_uris', REDIRECT_URI)
  formData.append('scopes', 'read write follow push admin')

  return promisedRequest({
    url: '/api/v1/apps',
    method: 'POST',
    formData,
  }).then(({ data, ...rest }) => ({
    ...rest,
    data: {
      ...data,
      clientId: data.client_id,
      clientSecret: data.client_secret,
    },
  }))
}

export const verifyAppToken = ({ credentials }) =>
  promisedRequest({
    url: MASTODON_APP_VERIFY_URL,
    credentials,
  })

export const getLoginUrl = ({ instance, clientId }) => {
  const data = {
    responseType: 'code',
    clientId,
    redirectUri: REDIRECT_URI,
    scope: 'read write follow push admin',
  }

  return `${instance}/oauth/authorize${paramsString(data)}`
}

export const getTokenWithCredentials = ({
  clientId,
  clientSecret,
  username,
  password,
}) => {
  const formData = new window.FormData()

  formData.append('client_id', clientId)
  formData.append('client_secret', clientSecret)
  formData.append('grant_type', 'password')
  formData.append('username', username)
  formData.append('password', password)

  return promisedRequest({
    url: '/oauth/token',
    method: 'POST',
    formData,
  })
}

export const getToken = ({ clientId, clientSecret, code }) => {
  const formData = new window.FormData()

  formData.append('client_id', clientId)
  formData.append('client_secret', clientSecret)
  formData.append('grant_type', 'authorization_code')
  formData.append('code', code)
  formData.append('redirect_uri', `${window.location.origin}/oauth-callback`)

  return promisedRequest({
    url: '/oauth/token',
    method: 'POST',
    formData,
  })
}

export const getClientToken = ({ clientId, clientSecret }) => {
  const formData = new window.FormData()

  formData.append('client_id', clientId)
  formData.append('client_secret', clientSecret)
  formData.append('grant_type', 'client_credentials')
  formData.append('redirect_uri', `${window.location.origin}/oauth-callback`)

  return promisedRequest({
    url: '/oauth/token',
    method: 'POST',
    formData,
  })
}

export const verifyOTPCode = ({ app, mfaToken, code }) => {
  const formData = new window.FormData()

  formData.append('client_id', app.client_id)
  formData.append('client_secret', app.client_secret)
  formData.append('mfa_token', mfaToken)
  formData.append('code', code)
  formData.append('challenge_type', 'totp')

  return promisedRequest({
    url: '/oauth/mfa/challenge',
    method: 'POST',
    formData,
  })
}

export const verifyRecoveryCode = ({ app, mfaToken, code }) => {
  const formData = new window.FormData()

  formData.append('client_id', app.client_id)
  formData.append('client_secret', app.client_secret)
  formData.append('mfa_token', mfaToken)
  formData.append('code', code)
  formData.append('challenge_type', 'recovery')

  return promisedRequest({
    url: '/oauth/mfa/challenge',
    method: 'POST',
    formData,
  })
}

export const revokeToken = ({ app, token }) => {
  const formData = new window.FormData()

  formData.append('client_id', app.clientId)
  formData.append('client_secret', app.clientSecret)
  formData.append('token', token)

  return promisedRequest({
    url: '/oauth/revoke',
    method: 'POST',
    formData,
  })
}
