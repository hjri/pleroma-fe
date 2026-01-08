import { useListsStore } from 'src/stores/lists.js'
import apiService from '../api/api.service.js'
import { promiseInterval } from '../promise_interval/promise_interval.js'

const fetchAndUpdate = ({ credentials }) => {
  return apiService
    .fetchLists({ credentials })
    .then(
      (lists) => {
        useListsStore().setLists(lists)
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
  return promiseInterval(boundFetchAndUpdate, 240000)
}

const listsFetcher = {
  startFetching,
}

export default listsFetcher
