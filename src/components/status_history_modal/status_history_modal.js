import { mapState } from 'pinia'

import Modal from 'src/components/modal/modal.vue'
import StatusContent from 'src/components/status_content/status_content.vue'

import { useStatusHistoryStore } from 'src/stores/statusHistory.js'

const StatusHistoryModal = {
  components: {
    Modal,
    StatusContent,
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
