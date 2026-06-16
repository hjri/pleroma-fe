// promiseInterval - replacement for setInterval for promises, starts counting
// the interval only after a promise is done instead of immediately.
// - promiseCall is a function that returns a promise, it's called the first
// time after the first interval.
// - interval is the interval delay in ms.

const wait = (timeout) => {
  let timeoutId
  const promise = () =>
    new Promise((resolve) => {
      timeoutId = window.setTimeout(() => resolve(), timeout)
    })
  return { timeoutId, promise }
}

export const promiseInterval = (promiseCall, interval) => {
  let stopped = false
  let timeout = null

  const stopFetcher = () => {
    stopped = true
    window.clearTimeout(timeout)
  }

  const loop = new Promise(async (resolve, reject) => {
    try {
      while (!stopped) {
        await promiseCall()
        const { timeoutId, promise } = wait(interval)
        timeout = timeoutId
        await promise()
      }
      resolve()
    } catch (e) {
      reject(e)
    }
  })

  loop.then()

  return { stop: stopFetcher }
}
