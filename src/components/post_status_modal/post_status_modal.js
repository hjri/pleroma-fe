import get from 'lodash/get'

import { usePostStatusStore } from 'src/stores/post_status'
import Modal from '../modal/modal.vue'
import PostStatusForm from '../post_status_form/post_status_form.vue'

const PostStatusModal = {
  components: {
    PostStatusForm,
    Modal,
  },
  data() {
    return {
      resettingForm: false,
    }
  },
  computed: {
    isLoggedIn() {
      return !!this.$store.state.users.currentUser
    },
    modalActivated() {
      return usePostStatusStore().modalActivated
    },
    isFormVisible() {
      return this.isLoggedIn && !this.resettingForm && this.modalActivated
    },
    params() {
      return usePostStatusStore().params || {}
    },
  },
  watch: {
    params(newVal, oldVal) {
      if (get(newVal, 'repliedUser.id') !== get(oldVal, 'repliedUser.id')) {
        this.resettingForm = true
        this.$nextTick(() => {
          this.resettingForm = false
        })
      }
    },
    isFormVisible(val) {
      if (val) {
        this.$nextTick(
          () => this.$el && this.$el.querySelector('textarea').focus(),
        )
      }
    },
  },
  methods: {
    closeModal() {
      usePostStatusStore().closePostStatusModal()
    },
    resetAndClose() {
      usePostStatusStore().resetPostStatusModal()
      usePostStatusStore().closePostStatusModal()
    },
  },
}

export default PostStatusModal
