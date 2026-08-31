import { ref } from 'vue'

import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useUsersStore } from 'src/stores/users.js'

import { fetchFollowRequests } from 'src/api/user.js'
import { promiseInterval } from 'src/services/promise_interval/promise_interval.js'

const followRequestFetcher = ({ credentials }) => {
  const interval = ref(null)

  const fetchAndUpdate = () => {
    return fetchFollowRequests({ credentials })
      .then((result) => {
        const { data: requests } = result
        useFollowRequestsStore().setFollowRequests(requests)
        useUsersStore().addNewUsers(result)
      })
      .catch((e) => {
        console.error(e)
      })
  }

  const startFetching = () => {
    if (interval.value) throw new Error('Interval already exists!')

    fetchAndUpdate()

    interval.value = promiseInterval(fetchAndUpdate, 10000)
  }

  const stopFetching = () => {
    interval.value.stop()
    interval.value = null
  }

  return {
    fetchAndUpdate,
    startFetching,
    stopFetching,
  }
}

export default followRequestFetcher
