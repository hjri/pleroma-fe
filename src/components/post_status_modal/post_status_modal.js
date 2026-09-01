import { get } from 'lodash'
import { mapState } from 'pinia'

import Modal from 'src/components/modal/modal.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'

import { usePostStatusStore } from 'src/stores/post_status.js'
import { useUsersStore } from 'src/stores/users.js'

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
    modalActivated() {
      return usePostStatusStore().modalActivated
    },
    isFormVisible() {
      return this.loggedIn && !this.resettingForm && this.modalActivated
    },
    params() {
      return usePostStatusStore().params || {}
    },
    ...mapState(useUsersStore, ['loggedIn']),
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
        this.$nextTick(() => this.$el?.querySelector('textarea').focus())
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
