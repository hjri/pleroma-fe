import { capitalize } from 'lodash'

function humanizeErrors(errors) {
  return Object.entries(errors).reduce((errs, [k, val]) => {
    const message = val.reduce((acc, message) => {
      const key = capitalize(k.replaceAll('_', ' '))
      return acc + [key, message].join(' ') + '. '
    }, '')
    return [...errs, message]
  }, [])
}

export function StatusCodeError(statusCode, body, options, response) {
  this.name = 'StatusCodeError'
  this.statusCode = statusCode
  this.statusText = body.error || body.errors || body
  this.details = JSON.stringify(body)
  this.errorData = body.error || body.errors
  this.message = this.statusCode + ' - ' + this.statusText
  this.error = body // legacy attribute
  this.options = options
  this.response = response

  if (Error.captureStackTrace) {
    // required for non-V8 environments
    Error.captureStackTrace(this)
  }
}
StatusCodeError.prototype = Object.create(Error.prototype)
StatusCodeError.prototype.constructor = StatusCodeError

export class RegistrationError extends Error {
  constructor(error) {
    super()
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this)
    }

    try {
      // the error is probably a JSON object with a single key, "errors", whose value is another JSON object containing the real errors
      if (typeof error === 'string') {
        error = JSON.parse(error)
        if (Object.hasOwn(error, 'error')) {
          error = JSON.parse(error.error)
        }
      }

      if (typeof error === 'object') {
        const errorContents = JSON.parse(error.error)
        // keys will have the property that has the error, for example 'ap_id',
        // 'email' or 'captcha', the value will be an array of its error
        // like "ap_id": ["has been taken"] or "captcha": ["Invalid CAPTCHA"]

        // replace ap_id with username
        if (errorContents.ap_id) {
          errorContents.username = errorContents.ap_id
          delete errorContents.ap_id
        }

        this.message = humanizeErrors(errorContents)
      } else {
        this.message = error
      }
    } catch {
      // can't parse it, so just treat it like a string
      this.message = error
    }
  }
}
