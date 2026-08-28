<template>
  <Modal
    v-if="loggedIn && !resettingForm"
    :is-open="modalActivated"
    class="post-form-modal-view"
    @backdrop-clicked="closeModal"
  >
    <div class="post-form-modal-panel panel">
      <div class="panel-heading">
        <h1 class="title">
          {{ $t('post_status.new_status') }}
        </h1>
      </div>
      <PostStatusForm
        class="panel-body"
        v-bind="params"
        :closeable="true"
        @posted="resetAndClose"
        @draft-done="resetAndClose"
      />
    </div>
  </Modal>
</template>

<script src="./post_status_modal.js"></script>

<style lang="scss">
.modal-view.post-form-modal-view {
  align-items: flex-start;
}

.post-form-modal-panel {
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
