import { cloneDeep } from 'lodash'
import { defineAsyncComponent } from 'vue'

import StatusContent from 'src/components/status_content/status_content.vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPollH } from '@fortawesome/free-solid-svg-icons'

library.add(faPollH)

const Draft = {
  components: {
    PostStatusForm: defineAsyncComponent(
      () => import('src/components/post_status_form/post_status_form.vue'),
    ),
    EditStatusForm: defineAsyncComponent(
      () => import('src/components/edit_status_form/edit_status_form.vue'),
    ),
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),

    StatusContent,
    Gallery: defineAsyncComponent(
      () => import( 'src/components/gallery/gallery.vue')
    ),
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
      showingConfirmDialog: false,
    }
  },
  computed: {
    relAttrs() {
      if (this.draft.type === 'edit') {
        return { statusId: this.draft.refId }
      } else if (this.draft.type === 'reply') {
        return { replyTo: this.draft.refId }
      } else {
        return {}
      }
    },
    safeToSave() {
      return (
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
        ? this.$store.state.statuses.allStatusesObject[this.draft.refId]
        : undefined
    },
    localCollapseSubjectDefault() {
      return useMergedConfigStore().mergedConfig.collapseMessageWithSubject
    },
    nsfwClickthrough() {
      if (!this.draft.nsfw) {
        return false
      }
      if (this.draft.summary && this.localCollapseSubjectDefault) {
        return false
      }
      return true
    },
  },
  watch: {
    editing(newVal) {
      if (newVal) return
      if (this.safeToSave) {
        this.$store.dispatch('addOrSaveDraft', { draft: this.draft })
      } else {
        this.$store.dispatch('addOrSaveDraft', { draft: this.referenceDraft })
      }
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
      this.$store.dispatch('abandonDraft', { id: this.draft.id }).then(() => {
        this.hideConfirmDialog()
      })
    },
    hideConfirmDialog() {
      this.showingConfirmDialog = false
    },
  },
}

export default Draft
