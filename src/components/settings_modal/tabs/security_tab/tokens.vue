<template>
<div class="Tokens setting-section">
  <h3>{{ $t('settings.oauth_tokens') }}</h3>
  <p class="alerts">
    <div
      v-if="noUs"
      class="alert warning"
    >
      {{ $t('settings.tokens.no_current_info') }}
      <br />
      {{ $t('settings.tokens.no_current_consequences') }}
    </div>
    <div
      v-if="error"
      class="alert error"
    >
      {{ $t('settings.tokens.error') }}
      <pre>{{ error }}</pre>
      <button
        :title="$t('general.dismiss')"
        class="button-unstyled dismiss"
        @click="error = null"
      >
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="times"
        />
      </button>
    </div>
  </p>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th class="selection">
            <Checkbox
              :model-value="allSelected"
              :indeterminate="someSelected"
              @update:model-value="toggleSelectAll"
              :title="$t('selectable_list.select_all')"
            />
          </th>
          <th>{{ $t('settings.app_name') }}</th>
          <th>{{ $t('settings.tokens.last_active') }}</th>
          <th>{{ $t('settings.valid_until') }}</th>

          <th class="actions">
            <button
              class="btn button-default"
              @click="revokeSelected"
              :disabled="!(someSelected || allSelected)"
            >
              {{ $t('settings.tokens.revoke_selected') }}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="oauthToken in allTokens"
          :key="oauthToken.id"
          :class="{ '-us': oauthToken.current }"
        >
          <td class="selection">
            <Checkbox
              :model-value="selected.has(oauthToken.id)"
              @update:model-value="e => toggleSelect(oauthToken.id, e)"
              :title="$t('selectable_list.select')"
            />
          </td>
          <td>
            {{ oauthToken.appName }} {{ oauthToken.current ? $t('settings.tokens.current') : '' }}
          </td>
          <td>
            <Timeago
              v-if="oauthToken.lastActive"
              :time="oauthToken.lastActive"
              template-key="time.in_past"
              :auto-update="60"
            />
          </td>
          <td>{{ oauthToken.validLocalized }}</td>
          <td class="actions">
            <button
              class="btn button-default"
              @click="revokeSingleToken(oauthToken.id)"
              :class="{ '-danger': oauthToken.current }"
            >
              {{ $t('settings.revoke_token') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="revokeProgress"
      class="overlay"
    >
      <FAIcon
        class="revoke-progress-spinner"
        spin
        icon="circle-notch"
      />
      <p class="revoke-progress-progress">
        <strong>{{ $t('settings.tokens.in_progress') }}</strong>
      </p>
      <p class="revoke-progress-progress">
        {{ $t('settings.tokens.progress_status', { n: revokeQueue.length }) }}
      </p>
      <button
        class="abort-button btn button-default"
        @click="revokeAbort"
      >
        {{ $t('general.abort') }}
      </button>
    </div>
  </div>
  <ConfirmModal
    v-if="showConfirm"
    :title="$t('settings.tokens.confirm_title')"
    :confirm-text="$t('settings.revoke_token')"
    :cancel-text="$t('general.cancel')"
    @accepted="revokeTokens"
    @cancelled="revokeAbort"
  >
    {{ $t('settings.tokens.confirm_content', { n: revokeQueue.length }) }}
  </ConfirmModal>
</div>
</template>

<script src="./tokens.js" />
<style src="./tokens.scss" />
