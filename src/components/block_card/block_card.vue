<template>
  <basic-user-card :user="user">
    <div class="block-card-content-container">
      <span v-if="blocked" class="alert neutral">
        {{ blockExpiry }}
      </span>
      {{ ' ' }}
      <button
        v-if="blocked"
        class="btn button-default"
        @click="unblockUser"
      >
        {{ $t('user_card.unblock') }}
      </button>
      <button
        v-else
        class="btn button-default"
        @click="blockUser"
      >
        {{ $t('user_card.block') }}
      </button>
    </div>
    <teleport to="#modal">
      <UserTimedFilterModal
        :user="user"
        :is-mute="false"
        ref="timedBlockDialog"
      />
    </teleport>
  </basic-user-card>
</template>

<script src="./block_card.js"></script>

<style lang="scss">
.block-card-content-container {
  margin-top: 0.5em;
  text-align: right;

  button {
    width: 10em;
  }
}
</style>
