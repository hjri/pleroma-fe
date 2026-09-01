import { defineAsyncComponent } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

export default {
  props: ['user', 'relationship'],
  data() {
    return {
      inProgress: false,
      showingConfirmRemoveFollower: false,
    }
  },
  components: {
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
  },
  computed: {
    label() {
      if (this.inProgress) {
        return this.$t('user_card.follow_progress')
      } else {
        return this.$t('user_card.remove_follower')
      }
    },
    shouldConfirmRemoveUserFromFollowers() {
      return useMergedConfigStore().mergedConfig.modalOnRemoveUserFromFollowers
    },
  },
  methods: {
    showConfirmRemoveUserFromFollowers() {
      this.showingConfirmRemoveFollower = true
    },
    hideConfirmRemoveUserFromFollowers() {
      this.showingConfirmRemoveFollower = false
    },
    onClick() {
      if (!this.shouldConfirmRemoveUserFromFollowers) {
        this.doRemoveUserFromFollowers()
      } else {
        this.showConfirmRemoveUserFromFollowers()
      }
    },
    doRemoveUserFromFollowers() {
      this.inProgress = true
      useUsersStore()
        .removeUserFromFollowers(this.relationship.id)
        .finally(() => {
          this.inProgress = false
        })
      this.hideConfirmRemoveUserFromFollowers()
    },
  },
}
