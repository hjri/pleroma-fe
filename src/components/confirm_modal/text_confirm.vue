<template>
  <ConfirmModal
    v-if="showing"
    :title="title"
    :cancel-text="cancelText"
    :confirm-text="confirmText"
    @accepted="doWithText"
    @cancelled="hide"
  >
    <template #default>
      <span v-text="message" />
      <input
        v-model="text"
        class="input string-input filter-input"
      >
    </template>
  </ConfirmModal>
</template>

<script src="./text_confirm.js" />

<style lang="scss">
.expiry-amount {
  width: 4em;
  text-align: right;
}
</style>
