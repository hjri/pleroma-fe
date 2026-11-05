export default (millis) => {
  let timeoutId
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(), millis)
  })
  promise.abort = () => {
    clearTimeout(timeoutId)
  }
  return promise
}
