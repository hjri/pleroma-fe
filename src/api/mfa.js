import { promisedRequest } from './helpers.js'

export const verifyOTPCode = ({
  clientId,
  clientSecret,
  instance,
  mfaToken,
  code,
}) => {
  const formData = new window.FormData()

  formData.append('client_id', clientId)
  formData.append('client_secret', clientSecret)
  formData.append('mfa_token', mfaToken)
  formData.append('code', code)
  formData.append('challenge_type', 'totp')

  return promisedRequest({
    url: '/oauth/mfa/challenge'
    method: 'POST',
    formData,
  })
}

export const verifyRecoveryCode = ({
  clientId,
  clientSecret,
  instance,
  mfaToken,
  code,
}) => {
  const url = `${instance}`
  const formData = new window.FormData()

  formData.append('client_id', clientId)
  formData.append('client_secret', clientSecret)
  formData.append('mfa_token', mfaToken)
  formData.append('code', code)
  formData.append('challenge_type', 'recovery')

  return promisedRequest({
    url: '/oauth/mfa/challenge'
    method: 'POST',
    formData,
  })
}
