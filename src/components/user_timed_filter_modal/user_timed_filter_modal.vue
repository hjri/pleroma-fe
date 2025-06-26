<template>
  <confirm-modal
    v-if="showing"
    :title="$t(isMute ? $t('user_card.mute') : $t('user_card.block'))"
    :confirm-text="$t(isMute ? 'user_card.mute_confirm_accept_button' : 'user_card.block_confirm_accept_button')"
    :cancel-text="$t(isMute ? 'user_card.mute_confirm_cancel_button' : 'user_card.block_confirm_cancel_button')"
    @accepted="accept"
    @cancelled="cancel"
  >

    <p>
      {{ $t(isMute ? 'user_card.expire_mute_message' : 'user_card.expire_block_message', [user.screen_name]) }}
    </p>
    <p>
    {{ $t('user_card.expire_in') }}
      <input
        id="userFilterExpires"
        class="input input-expire-in"
        :class="{ disabled: forever }"
        v-model="expiration"
        :disabled="forever"
        min="1"
        type="number"
      >
      <Select
        id="userFilterExpiresUnit"
        v-model="expirationUnit"
        class="input unit-input unstyled"
        :disabled="forever"
      >
        <option key="s" value="s"> {{ $t('time.unit.seconds_suffix') }} </option>
        <option key="m" value="m"> {{ $t('time.unit.minutes_suffix') }} </option>
        <option key="h" value="h"> {{ $t('time.unit.hours_suffix') }} </option>
        <option key="d" value="d"> {{ $t('time.unit.days_suffix') }} </option>
      </Select>

      <br />
      <Checkbox
        id="forever"
        v-model="forever"
        name="forever"
        class="input-forever"
      >
        {{ $t('user_card.mute_block_forever') }}
      </Checkbox>
    </p>

    <Checkbox
      id="dontAskAgain"
      v-model="dontAskAgain"
      name="dontAskAgain"
      class="input-dont-ask-again"
    >
      {{ $t(isMute ? 'user_card.dont_ask_again_mute' : 'user_card.dont_ask_again_block') }}
    </Checkbox>
  </confirm-modal>
</template>

<script src="./user_timed_filter_modal.js"></script>

<style lang="scss" src="./user_timed_filter_modal.scss" />
