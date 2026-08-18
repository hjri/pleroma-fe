import Popover from 'src/components/popover/popover.vue'

import { useStatusesStore } from 'src/stores/statuses.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const StatusPopover = {
  name: 'StatusPopover',
  props: ['statusId'],
  data() {
    return {
      error: false,
    }
  },
  components: {
    Popover,
  },
  methods: {
    enter() {
      if (!this.status) {
        if (!this.statusId) {
          this.error = true
          return
        }
        useStatusesStore()
          .fetchStatus(this.statusId)
          .then(() => (this.error = false))
          .catch(() => (this.error = true))
      }
    },
  },
  watch: {
    status(newStatus, oldStatus) {
      if (newStatus !== oldStatus) {
        this.$nextTick(() => this.$refs.popover.updateStyles())
      }
    },
  },
}

export default StatusPopover
