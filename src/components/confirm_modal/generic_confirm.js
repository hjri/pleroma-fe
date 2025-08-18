import ConfirmModal from './confirm_modal.vue'
//import Select from 'src/components/select/select.vue'

export default {
  props: {
    callback: {
      type: Function
    },
    title: {
      type: String
    },
    cancelText: {
      type: String
    },
    confirmText: {
      type: String
    }
  },
  emits: ['hide', 'show'],
  data: () => ({
    showing: false
  }),
  components: {
    ConfirmModal
  },
  methods: {
    show () {
      this.showing = true
      this.$emit('show')
    },
    hide () {
      this.showing = false
      this.$emit('hide')
    }
  }
}
