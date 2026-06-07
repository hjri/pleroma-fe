import ConfirmModal from './confirm_modal.vue'
//import Select from 'src/components/select/select.vue'

export default {
  props: {
    title: {
      type: String,
    },
    message: {
      type: String,
    },
    cancelText: {
      type: String,
    },
    confirmText: {
      type: String,
    },
  },
  emits: ['hide', 'show', 'action'],
  data: () => ({
    showing: false,
  }),
  components: {
    ConfirmModal,
  },
  methods: {
    show() {
      this.showing = true
      this.$emit('show')
    },
    hide() {
      this.showing = false
      this.$emit('hide')
    },
    doGeneric() {
      this.$emit('action')
      this.hide()
    },
  },
}
