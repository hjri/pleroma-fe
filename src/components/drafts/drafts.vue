<template>
  <div class="Drafts">
    <div class="panel panel-default">
      <div class="panel-heading -sticky">
        <div class="title">
          {{ $t('drafts.drafts') }}
        </div>
      </div>
      <div class="panel-body">
        <div
          v-if="drafts.length === 0"
          class="empty-drafs-list-alert"
        >
          {{ $t('drafts.no_drafts') }}
        </div>
        <template v-else>
          <List
            :external-items="drafts"
            :non-interactive="true"
          >
            <template #item="{ item: draft }">
              <Draft
                class="draft"
                :draft="draft"
              />
            </template>
          </List>
          <div class="remove-all">
            <button
              class="btn -danger button-default"
              @click="abandonAll"
            >
              {{ $t('drafts.clean_drafts') }}
            </button>
          </div>
        </template>
      </div>
    </div>
    <teleport to="#modal">
      <ConfirmModal
        v-if="showingConfirmDialog"
        :confirm-danger="true"
        :title="$t('drafts.abandon_confirm_title')"
        :confirm-text="$t('drafts.abandon_confirm_accept_button')"
        :cancel-text="$t('drafts.abandon_confirm_cancel_button')"
        @accepted="doAbandonAll"
        @cancelled="hideConfirmDialog"
      >
        {{ $t('drafts.abandon_all_confirm') }}
      </ConfirmModal>
    </teleport>
  </div>
</template>

<script src="./drafts.js"></script>

<style lang="scss">
.Drafts {
  .draft {
    margin: 1em 0;
    width: 100%;
  }

  .remove-all {
    margin: 1em;
    display: flex;
    justify-content: center;
  }

  .empty-drafs-list-alert {
    padding: 3em;
    font-size: 1.2em;
    display: flex;
    justify-content: center;
    color: var(--textFaint);
  }
}

</style>
