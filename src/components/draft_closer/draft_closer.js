import { defineAsyncComponent } from 'vue'
import { useMergedConfigStore } from 'src/stores/merged_config.js'

const DraftCloser = {
  data() {
    return {
      showing: false,
    }
  },
  components: {
    DialogModal: defineAsyncComponent(
      () => import('src/components/dialog_modal/dialog_modal.vue'),
    ),
  },
  emits: ['save', 'discard'],
  computed: {
    action() {
      if (useMergedConfigStore().mergedConfig.autoSaveDraft) {
        return 'save'
      } else {
        return useMergedConfigStore().mergedConfig.unsavedPostAction
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
