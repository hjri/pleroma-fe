import { cloneDeep } from 'lodash'
import { defineAsyncComponent } from 'vue'

import Gallery from 'src/components/gallery/gallery.vue'
import PostStatusForm from 'src/components/post_status_form/post_status_form.vue'
import StatusContent from 'src/components/status_content/status_content.vue'

import { useDraftsStore } from 'src/stores/drafts.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPollH } from '@fortawesome/free-solid-svg-icons'

library.add(faPollH)

const Draft = {
  components: {
    PostStatusForm,
    EditStatusForm: defineAsyncComponent(
      () => import('src/components/edit_status_form/edit_status_form.vue'),
    ),
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
    StatusContent,
    Gallery,
  },
  props: {
    draft: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      referenceDraft: cloneDeep(this.draft),
      editing: false,
      showingForm: false,
      showingConfirmDialog: false,
    }
  },
  computed: {
    relAttrs() {
      if (this.draft.type === 'edit') {
        return { statusId: this.draft.refId }
      } else if (this.draft.type === 'reply') {
        return {
          repliedStatus: this.refStatus,
        }
      } else {
        return {}
      }
    },
    safeToSave() {
      return Boolean(
        this.draft.status ||
        this.draft.files?.length ||
        this.draft.hasPoll ||
        this.draft.hasQuote
      )
    },
    postStatusFormProps() {
      return {
        draftId: this.draft.id,
        ...this.relAttrs,
      }
    },
    refStatus() {
      return this.draft.refId
        ? useStatusesStore().allStatuses.get(this.draft.refId)
        : undefined
    },
    localCollapseSubjectDefault() {
      return useMergedConfigStore().mergedConfig.collapseMessageWithSubject
    },
  },
  watch: {
    editing(newVal) {
      this.showingForm = true
      if (newVal) return
      this.showingForm = false
    },
  },
  methods: {
    toggleEditing() {
      this.editing = !this.editing
    },
    abandon() {
      this.showingConfirmDialog = true
    },
    doAbandon() {
      useDraftsStore()
        .abandonDraft(this.draft.id)
        .then(() => {
          this.hideConfirmDialog()
        })
    },
    hideConfirmDialog() {
      this.showingConfirmDialog = false
    },
  },
}

export default Draft
