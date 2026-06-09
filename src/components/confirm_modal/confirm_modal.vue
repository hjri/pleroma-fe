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
  .content {
    display: flex;
    align-items: center;
    text-align: left;
    justify-content: center;
    line-height: 1.5;

    p {
      margin: 0.75em;
      margin-right: 0;

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
