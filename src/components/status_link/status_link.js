import StatusPopover from 'src/components/status_popover/status_popover.vue'

const StatusLink = {
  name: 'StatusLink',
  components: {
    StatusPopover,
  },
  props: {
    statusId: {
      required: true,
      type: String,
    },
    link: Boolean,
    chat: Boolean,
  },
  emits: ['navigate'],
  methods: {
    onLinkClick(e, navigate) {
      // Mouse, Pen, Touch all have respective pointerType, other
      // AT possibly might have vendor-specific strings but
      // interacting with Tab and Enter however gives empty string
      if (this.link || e.pointerType === '') {
        // Don't open popover as we're about to navigate
        e.stopPropagation()
        navigate()
      }
    },
    onPopoverClick(e) {
      if (!this.link) {
        this.$emit('navigate', this.statusId)
      }
    },
  },
  computed: {
    destination() {
      return {
        name: this.chat ? 'conversation2' : 'conversation',
        params: { statusId: this.statusId },
      }
    },
  },
}

export default StatusLink
