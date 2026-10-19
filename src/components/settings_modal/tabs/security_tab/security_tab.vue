<template>
  <div :label="$t('settings.security_tab')">
    <div class="setting-section">
      <h3>{{ $t('settings.change_email') }}</h3>
      <ul class="setting-list">
        <li>
          <span class="setting-item">
            <label
              class="setting-label"
              for="new-email"
            >
              {{ $t('settings.new_email') }}
            </label>
            <input
              id="new-email"
              v-model="newEmail"
              type="email"
              autocomplete="email"
              class="input"
            >
          </span>
          <span class="setting-item">
            <label
              class="setting-label"
              for="new-email-password"
            >
              {{ $t('settings.current_password') }}
            </label>
            <input
              id="new-email-password"
              v-model="changeEmailPassword"
              type="password"
              autocomplete="current-password"
              class="input setting-control"
            >
          </span>
          <span class="setting-item">
            <span class="setting-control">
              <button
                class="btn button-default"
                @click="changeEmail"
              >
                {{ $t('settings.save') }}
              </button>
            </span>
          </span>
          <center>
            <p v-if="changedEmail">
              {{ $t('settings.changed_email') }}
            </p>
            <template v-if="changeEmailError !== false">
              <p>{{ $t('settings.change_email_error') }}</p>
              <p>{{ changeEmailError }}</p>
            </template>
          </center>
        </li>
      </ul>
    </div>

    <div class="setting-section">
      <h3>{{ $t('settings.change_password') }}</h3>
      <ul class="setting-list">
        <li>
          <span class="setting-item">
            <label
              class="setting-label"
              for="new-password-current"
            >
              {{ $t('settings.current_password') }}
            </label>
            <input
              id="new-password-current"
              v-model="changePasswordInputs[0]"
              type="password"
              class="input setting-control"
            >
          </span>
          <span class="setting-item">
            <label
              class="setting-label"
              for="new-password-new"
            >
              {{ $t('settings.new_password') }}
            </label>
            <input
              id="new-password-new"
              v-model="changePasswordInputs[1]"
              type="password"
              class="input setting-control"
            >
          </span>
          <span class="setting-item">
            <label
              class="setting-label"
              for="new-password-again"
            >
              {{ $t('settings.confirm_new_password') }}
            </label>
            <input
              id="new-password-again"
              v-model="changePasswordInputs[2]"
              type="password"
              class="input setting-control"
            >
          </span>
          <span class="setting-item">
            <span class="setting-control">
              <button
                class="btn button-default"
                @click="changePassword"
              >
                {{ $t('settings.save') }}
              </button>
            </span>
          </span>
          <center>
            <p v-if="changedPassword">
              {{ $t('settings.changed_password') }}
            </p>
            <p v-else-if="changePasswordError !== false">
              {{ $t('settings.change_password_error') }}
            </p>
            <p v-if="changePasswordError">
              {{ changePasswordError }}
            </p>
          </center>
        </li>
      </ul>
    </div>

    <div class="setting-section">
      <h3>{{ $t('settings.account_alias') }}</h3>
      <ul class="setting-list">
        <li>
          <table v-if="aliases.length > 0">
            <thead>
              <tr>
                <th>{{ $t('settings.account_alias_table_head') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="alias in aliases"
                :key="alias"
              >
                <td>{{ alias }}</td>
                <td class="actions">
                  <button
                    class="btn button-default"
                    @click="removeAlias(alias)"
                  >
                    {{ $t('settings.remove_alias') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-if="listAliasesError"
            class="alert error"
          >
            {{ $t('settings.list_aliases_error', { error }) }}
            <FAIcon
              class="fa-scale-110 fa-old-padding"
              icon="times"
              :title="$t('settings.hide_list_aliases_error_action')"
              @click="listAliasesError = false"
            />
          </div>
        </li>
        <li>
          <div class="setting-item">
            <i18n-t
              scope="global"
              keypath="settings.new_alias_target"
              for="add-alias-target"
              tag="label"
              class="setting-label"
            >
              <template #example>
                <code>foo@example.org</code>
              </template>
            </i18n-t>
            <input
              id="add-alias-target"
              v-model="addAliasTarget"
              class="input setting-control"
            >
          </div>
          <div class="setting-item">
            <span class="setting-control">
              <button
                class="btn button-default"
                @click="addAlias"
              >
                {{ $t('settings.save') }}
              </button>
            </span>
          </div>
          <center>
            <p v-if="addedAlias">
              {{ $t('settings.added_alias') }}
            </p>
            <template v-if="addAliasError !== false">
              <p>{{ $t('settings.add_alias_error', { error: addAliasError }) }}</p>
            </template>
          </center>
        </li>
      </ul>
    </div>

    <div class="setting-section">
      <h3>{{ $t('settings.oauth_tokens') }}</h3>
      <table class="oauth-tokens">
        <thead>
          <tr>
            <th>{{ $t('settings.app_name') }}</th>
            <th>{{ $t('settings.valid_until') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="oauthToken in oauthTokens"
            :key="oauthToken.id"
          >
            <td>{{ oauthToken.appName }}</td>
            <td>{{ oauthToken.validUntil }}</td>
            <td class="actions">
              <button
                class="btn button-default"
                @click="revokeToken(oauthToken.id)"
              >
                {{ $t('settings.revoke_token') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <mfa />

    <div class="setting-section">
      <h3>{{ $t('settings.move_account') }}</h3>
      <p>{{ $t('settings.move_account_notes') }}</p>
      <ul class="setting-list">
        <li>
          <div class="setting-item">
            <i18n-t
              keypath="settings.move_account_target"
              tag="label"
              scope="global"
              class="setting-label"
              for="move-account-target"
            >
              <template #example>
                <code>foo@example.org</code>
              </template>
            </i18n-t>
            <input
              id="move-account-target"
              v-model="moveAccountTarget"
              class="input setting-control"
            >
          </div>
          <div class="setting-item">
            <label
              class="setting-label"
              for="move-account-password"
            >
              {{ $t('settings.current_password') }}
            </label>
            <input
              id="move-account-password"
              v-model="moveAccountPassword"
              type="password"
              autocomplete="current-password"
              class="input"
            >
          </div>
          <div class="setting-item">
            <div class="setting-control">
              <button
                class="btn button-default"
                @click="moveAccount"
              >
                {{ $t('settings.save') }}
              </button>
            </div>
          </div>
          <center>
            <p v-if="movedAccount">
              {{ $t('settings.moved_account') }}
            </p>
            <template v-if="moveAccountError !== false">
              <p>{{ $t('settings.move_account_error', { error: moveAccountError }) }}</p>
            </template>
          </center>
        </li>
      </ul>
    </div>

    <div class="setting-section">
      <h3>{{ $t('settings.delete_account') }}</h3>
      <p v-if="!deletingAccount">
        {{ $t('settings.delete_account_description') }}
      </p>
      <div v-if="deletingAccount">
        <p>{{ $t('settings.delete_account_instructions') }}</p>
        <p>{{ $t('login.password') }}</p>
        <input
          v-model="deleteAccountConfirmPasswordInput"
          type="password"
          class="input"
        >
        <button
          class="btn button-default"
          @click="deleteAccount"
        >
          {{ $t('settings.delete_account') }}
        </button>
      </div>
      <p v-if="deleteAccountError !== false">
        {{ $t('settings.delete_account_error') }}
      </p>
      <p v-if="deleteAccountError">
        {{ deleteAccountError }}
      </p>
      <button
        v-if="!deletingAccount"
        class="btn button-default -danger"
        @click="confirmDelete"
      >
        {{ $t('settings.delete_account') }}
      </button>
    </div>
  </div>
</template>

<script src="./security_tab.js"></script>
<!-- <style lang="scss" src="./profile.scss"></style> -->
