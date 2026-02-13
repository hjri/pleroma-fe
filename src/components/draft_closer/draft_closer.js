import DialogModal from 'src/components/dialog_modal/dialog_modal.vue'

import { useSyncConfigStore } from 'src/stores/sync_config.js'

const DraftCloser = {
  data() {
    return {
      showing: false,
    }
  },
  components: {
    DialogModal,
  },
  emits: ['save', 'discard'],
  computed: {
    action() {
      if (useSyncConfigStore().mergedConfig.autoSaveDraft) {
        return 'save'
      } else {
        return useSyncConfigStore().mergedConfig.unsavedPostAction
      }
    },
    shouldConfirm() {
      return this.action === 'confirm'
    },
  },
  methods: {
    requestClose() {
      if (this.shouldConfirm) {
        this.showing = true
      } else if (this.action === 'save') {
        this.save()
      } else {
        this.discard()
      }
    },
    save() {
      this.$emit('save')
      this.showing = false
    },
    discard() {
      this.$emit('discard')
      this.showing = false
    },
    cancel() {
      this.showing = false
    },
  },
}

export default DraftCloser
