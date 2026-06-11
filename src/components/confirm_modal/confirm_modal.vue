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
        class="confirm-icon"
        icon="circle-question"
        size="3x"
        fixed-width
      />
      <div class="text">
        <slot />
      </div>
    </div>
    <div class="below">
      <slot name="below" />
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
  .confirm-icon {
    margin-left: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .content {
    display: flex;
    align-items: center;
    text-align: left;
    justify-content: center;
    line-height: 1.5;

    p {
      margin-top: 0.75em;
      margin-bottom: 0.75em;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .below:not(:empty) {
    margin-top: 1em;
  }

  .text {
    max-width: 50ch;
    margin-left: 0.5em;
    margin-right: 3.5em;
  }
}
</style>
