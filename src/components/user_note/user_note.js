import PanelLoading from 'src/components/panel_loading/panel_loading.vue'

import { useUsersStore } from 'src/stores/users.js'

const UserNote = {
  props: {
    user: Object,
    relationship: Object,
    editable: Boolean,
  },
  components: {
    PanelLoading,
  },
  data() {
    return {
      localNote: this.relationship.note,
      editing: false,
      frozen: false,
    }
  },
  watch: {
    relationship() {
      this.localNote = this.relationship.note
    },
  },
  methods: {
    startEditing() {
      this.localNote = this.relationship.note
      this.editing = true
    },
    finalizeEditing() {
      this.frozen = true

      useUsersStore()
        .editUserNote(this.user.id, this.localNote)
        .then(() => {
          this.frozen = false
          this.editing = false
        })
        .catch(() => {
          this.frozen = false
          this.editing = false
        })
    },
  },
}

export default UserNote
