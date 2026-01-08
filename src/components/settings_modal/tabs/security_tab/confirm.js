const Confirm = {
  props: ['disabled'],
  data: () => ({
    /* no-op */
  }),
  methods: {
    confirm() {
      this.$emit('confirm')
    },
    cancel() {
      this.$emit('cancel')
    },
  },
}
export default Confirm
