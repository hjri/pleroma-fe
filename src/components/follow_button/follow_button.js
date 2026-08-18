import { defineAsyncComponent } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useUsersStore } from 'src/stores/users.js'

export default {
  props: ['relationship', 'user', 'labelFollowing', 'buttonClass'],
  components: {
    ConfirmModal: defineAsyncComponent(
      () => import('src/components/confirm_modal/confirm_modal.vue'),
    ),
  },
  data() {
    return {
      inProgress: false,
      showingConfirmUnfollow: false,
    }
  },
  computed: {
    shouldConfirmUnfollow() {
      return useMergedConfigStore().mergedConfig.modalOnUnfollow
    },
    isPressed() {
      return this.inProgress || this.relationship.following
    },
    title() {
      if (this.inProgress || this.relationship.following) {
        return this.$t('user_card.follow_unfollow')
      } else if (this.relationship.requested) {
        return this.$t('user_card.follow_cancel')
      } else {
        return this.$t('user_card.follow')
      }
    },
    label() {
      if (this.inProgress) {
        return this.$t('user_card.follow_progress')
      } else if (this.relationship.following) {
        return this.labelFollowing || this.$t('user_card.following')
      } else if (this.relationship.requested) {
        return this.$t('user_card.follow_sent')
      } else {
        return this.$t('user_card.follow')
      }
    },
    disabled() {
      return this.inProgress || this.user.deactivated
    },
  },
  methods: {
    showConfirmUnfollow() {
      this.showingConfirmUnfollow = true
    },
    hideConfirmUnfollow() {
      this.showingConfirmUnfollow = false
    },
    onClick() {
      this.relationship.following || this.relationship.requested
        ? this.unfollow()
        : this.follow()
    },
    follow() {
      this.inProgress = true
      useUsersStore()
        .followUser(this.relationship.id)
        .finally(() => {
          this.inProgress = false
        })
    },
    unfollow() {
      if (this.shouldConfirmUnfollow) {
        this.showConfirmUnfollow()
      } else {
        this.doUnfollow()
      }
    },
    doUnfollow() {
      const store = this.$store
      this.inProgress = true
      useUsersStore()
        .unfollowUser(this.relationship.id)
        .finally(() => {
          this.inProgress = false
        })

      this.hideConfirmUnfollow()
    },
  },
}
