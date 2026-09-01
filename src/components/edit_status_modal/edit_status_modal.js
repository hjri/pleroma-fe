import { get } from 'lodash'
import { mapState } from 'pinia'
import { defineAsyncComponent } from 'vue'

import Modal from 'src/components/modal/modal.vue'

import { useEditStatusStore } from 'src/stores/editStatus.js'
import { useUsersStore } from 'src/stores/users.js'

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
    modalActivated() {
      return useEditStatusStore().modalActivated
    },
    isFormVisible() {
      return this.loggedIn && !this.resettingForm && this.modalActivated
    },
    params() {
      return useEditStatusStore().params || {}
    },
    ...mapState(useUsersStore, ['loggedIn']),
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
        this.$nextTick(() => this.$el?.querySelector('textarea').focus())
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
