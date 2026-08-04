import { get } from 'lodash'
import { defineAsyncComponent } from 'vue'

import Modal from 'src/components/modal/modal.vue'

import { useEditStatusStore } from 'src/stores/editStatus.js'

const EditStatusModal = {
  components: {
    EditStatusForm: defineAsyncComponent(
      () => import('src/components/edit_status_form/edit_status_form.vue'),
    ),
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
      return useEditStatusStore().modalActivated
    },
    isFormVisible() {
      return this.isLoggedIn && !this.resettingForm && this.modalActivated
    },
    params() {
      return useEditStatusStore().params || {}
    },
  },
  watch: {
    params(newVal, oldVal) {
      if (get(newVal, 'statusId') !== get(oldVal, 'statusId')) {
        this.resettingForm = true
        this.$nextTick(() => {
          this.resettingForm = false
        })
      }
    },
    isFormVisible(val) {
      if (val) {
        this.$nextTick(
          () => this.$el?.querySelector('textarea').focus(),
        )
      }
    },
  },
  methods: {
    closeModal() {
      this.$refs.editStatusForm.requestClose()
    },
    doCloseModal() {
      useEditStatusStore().closeEditStatusModal()
    },
  },
}

export default EditStatusModal
