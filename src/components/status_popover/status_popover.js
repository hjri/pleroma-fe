import Popover from 'src/components/popover/popover.vue'

import { useStatusesStore } from 'src/stores/statuses.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons'

library.add(faCircleNotch)

const StatusPopover = {
  name: 'StatusPopover',
  props: {
    statusId: String,
    link: Boolean,
  },
  emits: ['navigate'],
  data() {
    return {
      error: false,
    }
  },
  computed: {
    status() {
      return useStatusesStore().allStatuses.get(this.statusId)
    },
    statusLink() {
      return this.$router.resolve({
        name: 'conversation',
        params: { statusId: this.statusId },
      }).href
    },
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
    navigate() {
      if (this.link) {
        this.$router.push({
          name: 'conversation',
          params: { statusId: this.statusId },
        })
      } else {
        console.log(this.statusId)
        this.$emit('navigate', this.statusId)
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
