import { get } from 'lodash'

import Modal from 'src/components/modal/modal.vue'

import { useStatusesStore } from 'src/stores/statuses.js'
import { useStatusHistoryStore } from 'src/stores/statusHistory.js'

const StatusHistoryModal = {
  components: {
    Modal,
  },
  data() {
    return {
      statuses: [],
    }
  },
  computed: {
    modalActivated() {
      return useStatusHistoryStore().modalActivated
    },
    params() {
      return useStatusHistoryStore().params
    },
    statusId() {
      return this.params.id
    },
    historyCount() {
      return this.statuses.length
    },
    history() {
      return this.statuses
    },
  },
  watch: {
    params(newVal, oldVal) {
      const newStatusId = get(newVal, 'id') !== get(oldVal, 'id')
      if (newStatusId) {
        this.resetHistory()
      }

      if (
        newStatusId ||
        get(newVal, 'edited_at') !== get(oldVal, 'edited_at')
      ) {
        this.fetchStatusHistory()
      }
    },
  },
  methods: {
    resetHistory() {
      this.statuses = []
    },
    fetchStatusHistory() {
      useStatusesStore()
        .fetchStatusHistory(this.params)
        .then((data) => {
          this.statuses = data
        })
    },
    closeModal() {
      useStatusHistoryStore().closeStatusHistoryModal()
    },
  },
}

export default StatusHistoryModal
