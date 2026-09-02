import { defineAsyncComponent } from 'vue'
import { useDraftsStore } from 'src/stores/drafts.js'

import Draft from 'src/components/draft/draft.vue'
import List from 'src/components/list/list.vue'

const Drafts = {
  components: {
    Draft,
    List,
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
  },
  data() {
    return {
      showingConfirmDialog: false,
    }
  },
  computed: {
    drafts() {
      return useDraftsStore().draftsArray
    },
  },
  methods: {
    abandonAll() {
      this.showingConfirmDialog = true
    },
    doAbandonAll() {
      useDraftsStore().abandonAllDrafts()
        .then(() => this.hideConfirmDialog())
    },
    hideConfirmDialog() {
      this.showingConfirmDialog = false
    },
  },
}

export default Drafts
