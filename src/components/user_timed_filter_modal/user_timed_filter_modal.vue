<template>
  <dialog-modal
    v-if="showing"
    v-body-scroll-lock="true"
    class="confirm-modal UserTimedFilterModal"
    :on-cancel="cancel"
  >
    <template #header>
      <span>
        {{ isMute ? $t('user_card.mute') : $t('user_card.block') }}
      </span>
    </template>

    {{ $t('user_card.expire_at') }}

    <input
      id="userFilterExpires"
      class="input input-expire-at"
      type="datetime-local"
      v-model="expiration"
    >

    <Checkbox
      id="dontAskAgain"
      v-model="dontAskAgain"
      name="dontAskAgain"
      class="input-dont-ask-again"
    >
      {{ $t('user_card.dont_ask_again') }}
    </Checkbox>

    <template #footer>
      <button
        class="btn button-default"
        :disabled="!dateValid"
        :class="{ disabled: !dateValid  }"
        @click.prevent="temporarily"
      >
        {{ $t('user_card.mute_block_temporarily') }}
      </button>

      <button
        class="btn button-default"
        @click.prevent="forever"
      >
        {{ $t('user_card.mute_block_forever') }}
      </button>

      <button
        class="btn button-default"
        @click.prevent="cancel"
      >
        {{ $t('general.cancel') }}
      </button>
    </template>
  </dialog-modal>
</template>

<script src="./user_timed_filter_modal.js"></script>

<style lang="scss" src="./user_timed_filter_modal.scss" />
