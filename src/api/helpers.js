import { snakeCase } from 'lodash'

import { RegistrationError, StatusCodeError } from 'src/services/errors/errors'

export const paramsString = (params = {}) => {
  if (params == null || params === undefined) return ''

  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('Params are not an object!')
  }

  const entries = (() => {
    if (params instanceof Map) {
      return params.entries()
    } else {
      return Object.entries(params)
    }
  })()

  if (entries.length === 0) return ''

  const arrays = []
  const nonArrays = []

  entries.forEach(([k, v]) => {
    if (v == null) return // Drop nulls
    if (
      (typeof v === 'object' && !Array.isArray(v)) ||
      typeof v === 'function'
    ) {
      throw new Error('Param cannot be non-primitive!')
    }
    if (Array.isArray(v)) {
      arrays.push([k, v])
    } else {
      nonArrays.push([k, v])
    }
  })

  arrays.forEach(([k, array]) => {
    array.forEach((v) => {
      if (
        typeof v === 'object' ||
        typeof v === 'function' ||
        typeof v === 'undefined'
      )
        throw new Error('Array param cannot contain non-primitives!')
    })
  })

  return (
    '?' +
    [
      ...nonArrays.map(([k, v]) => [snakeCase(k), v]),
      // turning [a,[1,2,3]] into [[a[],1],[a[],2],[a[],3]]
      ...arrays.reduce(
        (acc, [k, arrayValue]) => [
          ...acc,
          ...arrayValue.map((v) => [snakeCase(k) + '[]', v]),
        ],
        [],
      ),
    ]
      .map(([k, v]) => `${k}=${window.encodeURIComponent(v)}`)
      .join('&')
  )
}

export const promisedRequest = async ({
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

  const response = await fetch(url, options)

  // 204 is "No content", which fails to parse json (as you'd might think)
  if (response.ok && response.status === 204) return { _response: response }

  try {
    const json = await response.json()

    if (typeof json !== 'object') {
      return {
        _response: response,
        _value: json,
      }
    }

    json._response = response

    if (!response.ok) {
      throw new StatusCodeError(
        response.status,
        json,
        { url, options },
        response,
      )
    }

    return json
  } catch (error) {
    throw new StatusCodeError(
      response.status,
      error,
      { url, options },
      response,
    )
  }
}

const authHeaders = (accessToken) => {
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` }
  } else {
    return {}
  }
}
