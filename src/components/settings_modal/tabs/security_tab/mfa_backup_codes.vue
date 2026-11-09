<template>
  <div class="mfa-backup-codes">
    <h5 v-if="displayTitle">
      {{ $t('settings.mfa.recovery_codes') }}
    </h5>
    <i v-if="inProgress">{{ $t('settings.mfa.waiting_a_recovery_codes') }}</i>
    <template v-if="ready">
      <p class="alert warning">
        {{ $t('settings.mfa.recovery_codes_warning') }}
      </p>
      <ul class="backup-codes">
        <li
          v-for="code in backupCodes.codes"
          :key="code"
        >
          {{ code }}
        </li>
      </ul>
    </template>
  </div>
</template>
<script src="./mfa_backup_codes.js"></script>
<style lang="scss">
.mfa-backup-codes {
  .warning {
    color: var(--cOrange);
  }

  .backup-codes {
    font-family: var(--monoFont);
  }
}
</style>
