// Where the instance's API lives. Empty when the page is served by the
// instance itself (paths stay relative, as always); the chosen instance's
// origin when this frontend is hosted on its own domain.

let base = ''

export const setApiBase = (url) => {
  base = url ? url.replace(/\/+$/, '') : ''
}

const isAbsolute = (url) => /^[a-z][a-z\d+.-]*:/i.test(url)

// a path on the instance
export const apiUrl = (path) => (base && !isAbsolute(path) ? base + path : path)

// a WebSocket URL on the instance (ws: for http:, wss: for https:),
// always absolute: WebSocket takes relative URLs only in recent browsers
export const streamingUrl = (path) =>
  (base || window.location.origin).replace(/^http/, 'ws') + path

// a file the server provides (default avatar, banner): the server in front
// of a path, a full URL as it is
export const serverUrl = (server, path) =>
  isAbsolute(path) ? path : server + path
