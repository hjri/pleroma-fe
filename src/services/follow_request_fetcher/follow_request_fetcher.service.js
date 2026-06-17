import { fetchFollowRequests } from 'src/api/user.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

const fetchAndUpdate = ({ store, credentials }) => {
  return fetchFollowRequests({ credentials })
    .then(
      (requests) => {
        store.commit('setFollowRequests', requests)
        store.commit('addNewUsers', requests)
      },
      (rej) => {
        console.error(rej)
      },
    )
    .catch((e) => {
      console.error(e)
    })
}

const startFetching = ({ credentials, store }) => {
  const boundFetchAndUpdate = () => fetchAndUpdate({ credentials, store })
  boundFetchAndUpdate()
  return promiseInterval(boundFetchAndUpdate, 10000)
}

const followRequestFetcher = {
  startFetching,
}

export default followRequestFetcher
