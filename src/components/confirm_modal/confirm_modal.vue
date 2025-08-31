<template>
  <DialogModal
    v-body-scroll-lock="true"
    class="confirm-modal"
    @cancel="onCancel"
  >
    <template #header>
      <span v-text="title" />
    </template>

    <slot />

    <template #footer>
      <slot name="footerLeft" />
      <button
        class="btn button-default"
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
