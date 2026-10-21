<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="RateSetting setting-item"
  >
    <legend
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator :is-local="isLocalSetting" />
      {{ ' ' }}
      <template v-if="backendDescriptionLabel">
        {{ backendDescriptionLabel + ' ' }}
      </template>
      <template v-else-if="source === 'admin'">
        MISSING LABEL FOR {{ path }}
      </template>
      <slot v-else />
    </legend>
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
    <div class="setting-control">
      <table>
        <thead>
          <tr>
            <td>&nbsp;</td>
            <th :id="idPrefix + 'header-period'">
              {{ $t('admin_dash.rate_limit.period') }}
            </th>
            <th :id="idPrefix + 'header-amount'">
              {{ $t('admin_dash.rate_limit.amount') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              {{ isSeparate ? $t('admin_dash.rate_limit.unauthenticated') : $t('admin_dash.rate_limit.all') }}
            </th>
            <td>
              <input
                :id="idPrefix + 'period'"
                :aria-labelledby="idPrefix + 'header-period'"
                class="input string-input"
                type="number"
                :value="normalizedState[0][0]"
                @change="e => update({ event: e, index: 0, side: 0, eventType: 'edit' })"
              >
            </td>
            <td>
              <input
                :id="idPrefix + 'amount'"
                :aria-labelledby="idPrefix + 'header-amount'"
                class="input string-input"
                type="number"
                :value="normalizedState[0][1]"
                @change="e => update({ event: e, index: 1, side: 0, eventType: 'edit' })"
              >
            </td>
          </tr>
          <tr v-if="isSeparate">
            <th scope="row">
              {{ $t('admin_dash.rate_limit.authenticated') }}
            </th>
            <td>
              <input
                :id="idPrefix + 'period2'"
                :aria-labelledby="idPrefix + 'header-period'"
                class="input string-input"
                type="number"
                :value="normalizedState[1][0]"
                @change="e => update({ event: e, index: 0, side: 1, eventType: 'edit' })"
              >
            </td>
            <td>
              <input
                :id="idPrefix + 'amount2'"
                :aria-labelledby="idPrefix + 'header-amount'"
                class="input string-input"
                type="number"
                :value="normalizedState[1][1]"
                @change="e => update({ event: e, index: 1, side: 1, eventType: 'edit' })"
              >
            </td>
          </tr>
        </tbody>
      </table>
      <Checkbox
        :model-value="isSeparate"
        @update:model-value="event => update({ event: event ? 'split' : 'join', eventType: 'toggleMode' })"
      >
        {{ $t('admin_dash.rate_limit.separate') }}
      </Checkbox>
    </div>
    <DraftButtons />
  </fieldset>
</template>

<script src="./rate_setting.js"></script>
<style lang="scss">
.RateSetting {
  &.setting-item {
    display: grid;
    grid-template-areas:
      "label control"
      "desc control"
      ". draft";

    .setting-label {
      text-align: right;
      align-self: center;
    }

    .setting-description {
      text-align: right;
    }

    .setting-control {
      align-self: end;
      flex-direction: column;
      align-items: start;
    }
  }

  table {
    margin-top: 0.5em;
  }

  th {
    font-weight: normal;
  }

  tbody th {
    text-align: right;
  }

  td {
    input {
      width: 15ch;
    }
  }

  margin-bottom: 2em;
}
</style>
