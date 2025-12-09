<template>
  <div
    v-if="matchesExpertLevel"
    class="RateSetting"
  >
    <label
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <template v-if="backendDescriptionLabel">
        {{ backendDescriptionLabel + ' ' }}
      </template>
      <template v-else-if="source === 'admin'">
        MISSING LABEL FOR {{ path }}
      </template>
      <slot v-else />
    </label>
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
    <table>
      <tr>
        <th>&nbsp;</th>
        <th>
          {{ $t('admin_dash.rate_limit.period') }}
        </th>
        <th>
          {{ $t('admin_dash.rate_limit.amount') }}
        </th>
      </tr>
      <tr>
        <td v-if="isSeparate">
          {{ $t('admin_dash.rate_limit.unauthenticated') }}
        </td>
        <td v-else>
          {{ $t('admin_dash.rate_limit.rate_limit') }}
        </td>
        <td>
          <input
            class="input string-input"
            type="number"
            :value="normalizedState[0][0]"
            @change="e => update({ event: e, index: 0, side: 0, eventType: 'edit' })"
          >
        </td>
        <td>
          <input
            class="input string-input"
            type="number"
            :value="normalizedState[0][1]"
            @change="e => update({ event: e, index: 1, side: 0, eventType: 'edit' })"
          >
        </td>
      </tr>
      <tr v-if="isSeparate">
        <td>
          {{ $t('admin_dash.rate_limit.authenticated') }}
        </td>
        <td>
          <input
            class="input string-input"
            type="number"
            :value="normalizedState[1][0]"
            @change="e => update({ event: e, index: 0, side: 1, eventType: 'edit' })"
          >
        </td>
        <td>
          <input
            class="input string-input"
            type="number"
            :value="normalizedState[1][1]"
            @change="e => update({ event: e, index: 1, side: 1, eventType: 'edit' })"
          >
        </td>
      </tr>
    </table>
    <Checkbox
      :model-value="isSeparate"
      @update:model-value="event => update({ event: event ? 'join' : 'split',  eventType: 'toggleMode' })"
    >
      {{ $t('admin_dash.rate_limit.separate') }}
    </Checkbox>
    <div>
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <ProfileSettingIndicator :is-profile="isProfileSetting" />
    <DraftButtons />
    </div>
  </div>
</template>

<script src="./rate_setting.js"></script>
<style lang="scss">
.RateSetting {
  table {
    margin-top: 0.5em;
  }

  th {
    font-weight: normal;
  }

  td {
    input {
      width: 15ch;
    }
  }

  margin-bottom: 2em;
}
</style>
