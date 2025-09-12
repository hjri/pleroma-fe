<template>
  <ConfirmModal
    v-if="showing"
    :title="title"
    :cancel-text="cancelText"
    :confirm-text="confirmText"
    @accepted="doGeneric"
    @cancelled="hide"
  >
    <template #default>
      <span v-text="message" />
    </template>
  </ConfirmModal>
</template>

<script src="./generic_confirm.js" />

<style lang="scss">
.expiry-amount {
  width: 4em;
  text-align: right;
}
</style>
