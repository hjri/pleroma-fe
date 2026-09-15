import { computed, toValue } from 'vue'
import { storeToRefs } from 'pinia'

import { useStatusesStore } from 'src/stores/statuses.js'

export function useMainStatus(statusId) {
  const statusesStore = storeToRefs(useStatusesStore())
  const getStatusObject = (id) => statusesStore.allStatuses.value.get(id)

  const status = computed(() => getStatusObject(statusId.value))

  const mainStatus = computed(() => {
    if (!status.value) return null
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
