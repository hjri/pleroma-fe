<template>
  <div
    v-if="readyInit && settings.available"
    class="setting-section mfa-settings"
  >
    <h3>{{ $t('settings.mfa.title') }}</h3>
    <div
      v-if="!setupInProgress"
      class="setting-section"
    >
      <!-- Enabled methods -->
      <h4>{{ $t('settings.mfa.authentication_methods') }}</h4>
      <TOTPItem
        :settings="settings"
        @deactivate="fetchSettings"
        @activate="activateOTP"
      />
      <br>

      <div v-if="settings.enabled">
        <template v-if="!confirmNewBackupCodes">
          <!-- backup codes block-->
          <RecoveryCodes :backup-codes="backupCodes" />
          <button
            class="btn button-default"
            @click="getBackupCodes"
          >
            {{ $t('settings.mfa.generate_new_recovery_codes') }}
          </button>
        </template>
        <div v-else>
          <confirm
            :disabled="backupCodes.inProgress"
            @confirm="confirmBackupCodes"
            @cancel="cancelBackupCodes"
          >
            <p class="warning">
              {{ $t('settings.mfa.warning_of_generate_new_codes') }}
            </p>
          </confirm>
        </div>
      </div>
    </div>
    <div v-else>
      <!-- setup block-->

      <h4>{{ $t('settings.mfa.setup_otp') }}</h4>

      <recovery-codes
        v-if="!setupOTPInProgress"
        :backup-codes="backupCodes"
      />

      <button
        v-if="canSetupOTP"
        class="btn button-default"
        @click="cancelSetup"
      >
        {{ $t('general.cancel') }}
      </button>
      {{ ' ' }}
      <button
        v-if="canSetupOTP"
        class="btn button-default"
        @click="setupOTP"
      >
        {{ $t('settings.mfa.setup_otp') }}
      </button>

      <template v-if="setupOTPInProgress">
        <i v-if="prepareOTP">{{ $t('settings.mfa.wait_pre_setup_otp') }}</i>

        <div v-if="confirmOTP">
          <div class="setup-otp">
            <div class="qr-code">
              <h5>{{ $t('settings.mfa.scan.title') }}</h5>
              <p>{{ $t('settings.mfa.scan.desc') }}</p>
              <qrcode
                :value="otpSettings.provisioning_uri"
                :options="{ width: 200 }"
              />
              <p>
                {{ $t('settings.mfa.scan.secret_code') }}:
                {{ otpSettings.key }}
              </p>
            </div>

            <div class="verify">
              <h5>{{ $t('general.verify') }}</h5>
              <p>
                {{ $t('settings.mfa.verify.desc') }}
              </p>
              <input
                v-model="otpConfirmToken"
                :title="$t('settings.mfa.verify.label')"
                type="text"
                class="input"
              >

              <p>{{ $t('settings.enter_current_password_to_confirm') }}:</p>
              <input
                v-model="currentPassword"
                type="password"
                :title="$t('settings.current_password')"
                class="input"
              >
              <div class="confirm-otp-actions">
                <button
                  class="btn button-default"
                  @click="doConfirmOTP"
                >
                  {{ $t('settings.mfa.confirm_and_enable') }}
                </button>
                <button
                  class="btn button-default"
                  @click="cancelSetup"
                >
                  {{ $t('general.cancel') }}
                </button>
              </div>
              <div
                v-if="error"
                class="alert error"
              >
                {{ error }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script src="./mfa.js"></script>
<style lang="scss">
.mfa-settings {
  .method-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
  }

  p {
    margin: 0 0 0.5em;
  }

  input {
    margin-bottom: 1em
  }

  .warning {
    color: var(--cOrange);
  }

  .setup-otp {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;

    .qr-code {
      flex: 1;
      padding-right: 0.7em;
    }

    .verify {
      flex: 1;
    }

    .error {
      margin: 0.3em 0 0;
    }

    .confirm-otp-actions {
      button {
        width: 15em;
        margin-top: 5px;
      }
    }
  }
}
</style>
