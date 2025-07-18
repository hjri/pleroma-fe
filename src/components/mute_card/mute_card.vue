<template>
  <basic-user-card :user="user">
    <div class="mute-card-content-container">
      <span v-if="muted && muteExpiryAvailable" class="alert neutral">
        {{ muteExpiry }}
      </span>
      {{ ' ' }}
      <button
        v-if="muted"
        class="btn button-default"
        @click="unmuteUser"
      >
        {{ $t('user_card.unmute') }}
      </button>
      <button
        v-else
        class="btn button-default"
        @click="muteUser"
      >
        {{ $t('user_card.mute') }}
      </button>
    </div>
    <teleport to="#modal">
      <UserTimedFilterModal
        :user="user"
        :is-mute="true"
        ref="timedMuteDialog"
      />
    </teleport>
  </basic-user-card>
</template>

<script src="./mute_card.js"></script>

<style lang="scss">
.mute-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>
