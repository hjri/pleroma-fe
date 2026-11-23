<template>
  <span
    v-if="matchesExpertLevel"
    class="UnitSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'value'"
      class="setting-label"
      :class="classes"
    >
      <SettingIndicators
        :is-changed="isChanged"
        :is-local="isLocalOnly"
        :is-overriden="isOverriden"
      />
      {{ ' ' }}
      <template v-if="realLabel">
        {{ realLabel + ' ' }}
      </template>
      <template v-else-if="source === 'admin'">
        MISSING LABEL FOR {{ path }}
      </template>
      <slot v-else />
    </label>
    {{ ' ' }}
    <span class="no-break setting-control">
      <input
        v-model="stateValue"
        :id="idPrefix + 'value'"
        class="input number-input"
        :class="classes"
        type="number"
        :step="realStep"
        :disabled="disabled"
        :placeholder="realSuggestions ?? placeholderValue"
        :min="realMin"
      >
      <Select
        v-model="stateUnit"
        :id="idPrefix + 'unit'"
        :disabled="disabled"
        class="unit-input unstyled"
        unstyled
        :placeholder="placeholderUnit"
        :aria-label="$t('settings.style.common.unit')"
      >
        <option
          v-for="option in realUnits"
          :key="option"
          :value="option"
        >
          {{ getUnitString(option) }}
        </option>
      </Select>
    </span>
    {{ ' ' }}
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
  </span>
</template>

<script src="./unit_setting.js"></script>

<style lang="scss">
.UnitSetting {
  .no-break {
    display: inline-flex;
  }

  .number-input {
    max-width: 6.5em;
    text-align: right;
  }

  .unit-input,
  .unit-input select {
    min-width: 4em;
    width: auto;
  }
}

</style>
