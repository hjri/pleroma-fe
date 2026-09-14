import { computed, toValue } from 'vue'

import { useStatusesStore } from 'src/stores/statuses.js'

export function useMainStatus(statusId) {
  const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)

  const status = computed(() => getStatusObject(toValue(statusId)))

  const mainStatus = computed(() => {
    if (!status.value) return
    const retweetedStatusId = status.value.retweeted_status?.id
    if (retweetedStatusId) {
      return getStatusObject(retweetedStatusId)
    } else {
      return status.value
    }
  })

  return {
    status,
    mainStatus,
  }
}
