// Hosted mode: this frontend served from its own domain, logging into an
// instance the user picks. The site turns it on in its static/config.json
// ("hosted": true); an instance serving the frontend itself never does.

const INSTANCE_KEY = 'pleroma-fe-hosted-instance'

export const isHosted = (staticConfig) => staticConfig?.hosted === true

// "pleroma.example", "@me@pleroma.example" or a URL on it -> its origin
export const instanceOrigin = (input) => {
  const text = (input ?? '').trim().replace(/^@?[^@\s/]+@/, '')
  if (!text) return null
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    const local = url.hostname === 'localhost'
    if (!url.hostname.includes('.') && !local) return null
    // the login token never goes over plain http to a real server
    if (!local) url.protocol = 'https:'
    return url.origin
  } catch {
    return null
  }
}

export const chosenInstance = () => localStorage.getItem(INSTANCE_KEY)
export const chooseInstance = (origin) =>
  localStorage.setItem(INSTANCE_KEY, origin)
export const forgetInstance = () => localStorage.removeItem(INSTANCE_KEY)

// an instance answers /api/v1/instance with JSON, and lets this site ask
export const checkInstance = async (origin, fetch = window.fetch) => {
  try {
    const res = await fetch(`${origin}/api/v1/instance`)
    if (!res.ok) return false
    const data = await res.json()
    return typeof data?.uri === 'string'
  } catch {
    return false
  }
}

// The instance's frontend configuration, for use on this site: its paths
// (logo, background, default avatar…) point at the instance, app routes
// stay routes, and login goes through the instance's own login page.
export const instanceConfig = (config, resolve) => ({
  ...Object.fromEntries(
    Object.entries(config ?? {}).map(([key, value]) => [
      key,
      typeof value === 'string' &&
      value.startsWith('/') &&
      !key.startsWith('redirect')
        ? resolve(value)
        : value,
    ]),
  ),
  loginMethod: 'token',
})
