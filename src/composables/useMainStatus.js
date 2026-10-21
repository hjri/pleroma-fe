import { computed, toValue } from 'vue'

import { useStatusesStore } from 'src/stores/statuses.js'

export function useMainStatus(statusId) {
  const statusesStore = useStatusesStore()
  const getStatusObject = (id) => statusesStore.allStatuses.get(id)

  const status = computed(() => getStatusObject(toValue(statusId)) ?? null)

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
