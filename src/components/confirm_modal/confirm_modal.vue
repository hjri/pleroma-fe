<template>
  <DialogModal
    v-body-scroll-lock="true"
    class="confirm-modal"
    @cancel="onCancel"
  >
    <template #header>
      <span v-text="title" />
    </template>

    <div class="content">
      <FAIcon
        icon="circle-question"
        size="3x"
        fixed-width
      />
      <div class="text">
        <slot />
      </div>
    </div>

    <template #footer>
      <slot name="footerLeft" />
      <button
        class="btn button-default"
        :class="{ '-danger': confirmDanger }"
        @click.prevent="onAccept"
        v-text="confirmText"
      />

      <button
        class="btn button-default"
        @click.prevent="onCancel"
        v-text="cancelText"
      />
    </template>
  </DialogModal>
</template>

<script src="./confirm_modal.js"></script>
<style lang="scss">
.confirm-modal {
  .dialog-modal-content {
    padding: 0;
  }

  .content {
    display: flex;
    align-items: start;
    text-align: left;
    line-height: 1.4;

    p {
      margin: 0.5em;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .text {
    max-width: 50ch;
  }
}
</style>
