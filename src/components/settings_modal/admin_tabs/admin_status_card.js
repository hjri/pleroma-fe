import Checkbox from 'src/components/checkbox/checkbox.vue'
import Select from 'src/components/select/select.vue'
import Status from 'src/components/status/status.vue'

import { parseStatus } from 'src/services/entity_normalizer/entity_normalizer.service.js'

const AdminStatusCard = {
  props: {
    /**
     * minimal status info
     * @type {import('vue').PropType<{
     *   id: string
     * }>}
     */
    statusDetails: {
      type: Object,
      required: true,
      /**
       * @param {any} u
       * @returns {u is { id: string }}
       */
      validator(u) {
        return typeof u.id === 'string'
      },
    },
  },
  data() {
    return {
      jsonExpanded: false,
      statusCache: undefined,
    }
  },
  computed: {
    /**
     * @returns {boolean} is this status sensitive?
     */
    isSensitive() {
      return this.statusDetails.sensitive === true
    },
    /**
     * @returns {'public' | 'unlisted' | 'private' | 'direct'} status visibility
     */
    visibility() {
      return this.statusDetails.visibility
    },
  },
  methods: {
    /**
     * @param {boolean} v set sensitive
     */
    changeSensitivity(v) {
      this.$store
        .dispatch('adminChangeStatusScope', {
          opts: { id: this.statusDetails.id, sensitive: v },
        })
        .then((res) => parseStatus(res))
        .then((s) => (this.statusCache = s))
    },
    /**
     * @param {boolean} v set visible
     */
    changeVisibility(v) {
      this.$store
        .dispatch('adminChangeStatusScope', {
          opts: { id: this.statusDetails.id, visibility: v },
        })
        .then((res) => parseStatus(res))
        .then((s) => (this.statusCache = s))
    },
    /**
     * show the confirmation box for bulk actions.
     * @param {string} box ref name specified for the confirm component
     */
    confirmSelection(box) {
      this.$refs[box].show()
      this.$refs.dropdown.hidePopover()
    },
    /**
     * called when a bulk action was confirmed
     * @param {string} action
     */
    selectionConfirmed(action, opts) {
      const restricted = []
      const s = this.$refs.userList.getSelected()
      s.forEach((u) => {
        if (
          restricted.includes(action) !== false ||
          u.id !== this.$store.state.users.currentUser.id
        ) {
          this.$store.dispatch(action, {
            id: this.statusDetails.id,
            ...(opts || {}),
          })
        }
      })
      this.reset()
    },
  },
  components: {
    Checkbox,
    Select,
    Status,
  },
  /**
   * fetch and cache status info
   */
  mounted() {
    this.$store
      .dispatch('adminChangeStatusScope', {
        opts: { id: this.statusDetails.id },
      })
      .then((res) => parseStatus(res))
      .then((s) => (this.statusCache = s))
  },
}

export default AdminStatusCard
