<template>
  <confirm-modal
    v-if="showing"
    :title="$t('user_card.mute_confirm_title')"
    :confirm-text="$t('user_card.mute_confirm_accept_button')"
    :cancel-text="$t('user_card.mute_confirm_cancel_button')"
    @accepted="doMute"
    @cancelled="hide"
  >
    <i18n-t
      :keypath="keypath"
      tag="div"
    >
      <template #domain>
        <span v-text="domain" />
      </template>
      <template #user>
        <span v-text="user.screen_name_ui" />
      </template>
    </i18n-t>
  </confirm-modal>
</template>

<script src="./mute_confirm.js" />

<style lang="scss">
.expiry-amount {
  width: 4em;
  text-align: right;
}
</style>
