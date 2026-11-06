export default (millis) => {
  let timeoutId
  const promise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(), millis)
  })
  // Careful, this will make promise to never resolve
  promise.abort = () => {
    clearTimeout(timeoutId)
  }
  return promise
}
