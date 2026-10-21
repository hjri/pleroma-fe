<template>
  <teleport to="#modal">
    <div>
      <ConfirmModal
        v-if="store.showingApproveConfirmDialog"
        :title="$t('user_card.approve_confirm_title')"
        :confirm-text="$t('user_card.approve_confirm_accept_button')"
        :cancel-text="$t('user_card.approve_confirm_cancel_button')"
        @accepted="store.doApprove"
        @cancelled="store.hideApproveConfirmDialog"
      >
        {{ $t('user_card.approve_confirm', { user: user.screen_name_ui }) }}
      </ConfirmModal>
      <ConfirmModal
        v-if="store.showingDenyConfirmDialog"
        :title="$t('user_card.deny_confirm_title')"
        :confirm-text="$t('user_card.deny_confirm_accept_button')"
        :cancel-text="$t('user_card.deny_confirm_cancel_button')"
        @accepted="store.doDeny"
        @cancelled="store.hideDenyConfirmDialog"
      >
        {{ $t('user_card.deny_confirm', { user: user.screen_name_ui }) }}
      </ConfirmModal>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue'

import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'

import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useUsersStore } from 'src/stores/users.js'

const store = useFollowRequestsStore()
const user = computed(() => useUsersStore().findUser(store.tempId))
</script>
