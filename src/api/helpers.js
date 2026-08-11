import { snakeCase } from 'lodash'

import { StatusCodeError } from 'src/services/errors/errors'

export const paramsString = (params = {}) => {
  if (params == null || params === undefined) return ''

  if (typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('Params are not an object!')
  }

  const entries = (() => {
    if (params instanceof Map) {
      return [...params.entries()]
    } else {
      return Object.entries(params)
    }
  })()

  const arrays = []
  const nonArrays = []

  entries.forEach(([k, v]) => {
    if (v == null) return // Drop nulls
    if (
      (typeof v === 'object' && !Array.isArray(v)) ||
      typeof v === 'function'
    ) {
      throw new TypeError('Param cannot be non-primitive!')
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
        throw new TypeError('Array param cannot contain non-primitives!')
    })
  })

  if (nonArrays.length + arrays.length === 0) return ''

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
  payload,
  formData,
  forceContentType,
  cache,
  credentials,
  headers = {},
}) => {
  const options = {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: forceContentType ?? 'application/json',
      ...headers,
    },
  }

  if (!formData) {
    options.headers['Content-Type'] = 'application/json'
  }

  if (cache) {
    options.cache = cache
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
  const data = await (async () => {
    const [contentType] = response.headers
      .get('content-type')
      .split(';')
      .map((x) => x.toLowerCase().trim())
    const contentLength = Number.parseInt(
      response.headers.get('content-length'),
    )
    if (contentLength === 0) return null

    switch (forceContentType ?? contentType) {
      case 'text/plain':
        return await response.text()
      case 'application/json':
        return await response.json()
      default:
        return await response.bytes()
    }
  })()

  const { ok, status } = response

  if (ok) {
    return { response, status, data }
  } else {
    throw new StatusCodeError(response.status, data, { url, options }, response)
  }
}

const authHeaders = (accessToken) => {
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` }
  } else {
    return {}
  }
}
