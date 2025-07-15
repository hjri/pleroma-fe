<template>
  <BasicUserCard :user="user">
    <div class="admin-card-content-container">
      <!--<button
        v-if="muted"
        class="btn button-default"
        :disabled="progress"
        @click="unmuteUser"
      >
        <template v-if="progress">
          {{ $t('user_card.unmute_progress') }}
        </template>
        <template v-else>
          {{ $t('user_card.unmute') }}
        </template>
      </button>
      <button
        v-else
        class="btn button-default"
        :disabled="progress"
        @click="muteUser"
      >
        <template v-if="progress">
          {{ $t('user_card.mute_progress') }}
        </template>
        <template v-else>
          {{ $t('user_card.mute') }}
        </template>
      </button>-->
    </div>
  </BasicUserCard>
</template>

<script src="./admin_card.js"></script>

<style lang="scss">
.admin-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>
