export default (millis) => {
  let timeoutId
  let promiseReject
  const promise = new Promise((resolve, reject) => {
    promiseReject = reject
    timeoutId = setTimeout(() => resolve(), millis)
  })
  promise.abort = () => {
    promiseReject?.(new Error('aborted'))
    clearTimeout(timeoutId)
  }
  return promise
}
