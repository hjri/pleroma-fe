<template>
  <Modal
    v-if="modalActivated"
    class="status-history-modal-view"
    aria-labelledby="status-history-modal-title"
    @backdrop-clicked="closeModal"
  >
    <div class="status-history-modal-panel panel">
      <div class="panel-heading">
        <h1
          id="status-history-modal-title"
          class="title"
        >
          {{ $t('status.status_history') }} ({{ historyCount }})
        </h1>
      </div>
      <div class="panel-body">
        <div
          v-if="historyCount > 0"
          class="history-body"
        >
          <Status
            v-for="status in history"
            :key="status.id"
            :statusoid="status"
            :is-preview="true"
            class="conversation-status panel-body"
          />
        </div>
      </div>
    </div>
  </Modal>
</template>

<script src="./status_history_modal.js"></script>

<style lang="scss">
.modal-view.status-history-modal-view {
  align-items: flex-start;
}

.status-history-modal-panel {
  flex-shrink: 0;
  margin-top: 25%;
  margin-bottom: 2em;
  width: 100%;
  max-width: 700px;

  @media (orientation: landscape) {
    margin-top: 8%;
  }
}
</style>
