import { mapState } from 'pinia'

import Modal from 'src/components/modal/modal.vue'
import Status from 'src/components/status/status.vue'

import { useStatusHistoryStore } from 'src/stores/statusHistory.js'

const StatusHistoryModal = {
  components: {
    Modal,
    Status,
  },
  data() {
    return {
      statuses: [],
    }
  },
  computed: {
    historyCount() {
      return this.history.length
    },
    ...mapState(useStatusHistoryStore, ['modalActivated', 'history']),
  },
  methods: {
    closeModal() {
      useStatusHistoryStore().closeModal()
    },
  },
}

export default StatusHistoryModal
