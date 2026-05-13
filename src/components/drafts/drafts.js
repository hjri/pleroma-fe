import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'
import Draft from 'src/components/draft/draft.vue'
import List from 'src/components/list/list.vue'

const Drafts = {
  components: {
    Draft,
    List,
    ConfirmModal,
  },
  data() {
    return {
      showingConfirmDialog: false,
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
      this.$store
        .dispatch('abandonAllDrafts')
        .then(() => this.hideConfirmDialog())
    },
    hideConfirmDialog() {
      this.showingConfirmDialog = false
    },
  },
}

export default Drafts
