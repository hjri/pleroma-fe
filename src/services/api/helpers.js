import { RegistrationError, StatusCodeError } from 'src/services/errors/errors'

export const promisedRequest = ({
  method,
  url,
  params,
  payload,
  formData,
  credentials,
  headers = {},
}) => {
  const options = {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  }
  if (!formData) {
    options.headers['Content-Type'] = 'application/json'
  }
  if (params) {
    url +=
      '?' +
      Object.entries(params)
        .map(
          ([key, value]) =>
            encodeURIComponent(key) + '=' + encodeURIComponent(value),
        )
        .join('&')
  }
  if (formData || payload) {
    options.body = formData || JSON.stringify(payload)
  }

  if (credentials) {
    options.headers = {
      ...options.headers,
      ...authHeaders(credentials),
    }
  }

  return fetch(url, options).then((response) => {
    return new Promise((resolve, reject) => {
      // 204 is "No content", which fails to parse json (as you'd might think)
      if (response.ok && response.status === 204) resolve()

      return response
        .json()
        .then((json) => {
          if (!response.ok) {
            return reject(
              new StatusCodeError(
                response.status,
                json,
                { url, options },
                response,
              ),
            )
          }

          json._response = response

          return resolve(json)
        })
        .catch((error) => {
          return reject(
            new StatusCodeError(
              response.status,
              error,
              { url, options },
              response,
            ),
          )
        })
    })
  })
}

const authHeaders = (accessToken) => {
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` }
  } else {
    return {}
  }
}
