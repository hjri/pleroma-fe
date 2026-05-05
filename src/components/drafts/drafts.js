import Draft from 'src/components/draft/draft.vue'
import List from 'src/components/list/list.vue'
import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'

const Drafts = {
  components: {
    Draft,
    List,
    ConfirmModal,
  },
  data() {
    return {
      showingConfirmDialog: false
    }
  },
  computed: {
    drafts() {
      return this.$store.getters.draftsArray
    },
  },
  methods: {
    abandonAll() {
      this.showingConfirmDialog = true
    },
    doAbandonAll() {
      this.drafts.forEach((draft) => {
        this.$store.dispatch('abandonDraft', { id: draft.id }).then(() => {
          this.hideConfirmDialog()
        })
      })
      this.hideConfirmDialog()
    },
    hideConfirmDialog() {
      this.showingConfirmDialog = false
    },
  }
}

export default Drafts
