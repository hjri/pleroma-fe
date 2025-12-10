<template>
  <span
    v-if="matchesExpertLevel"
    class="UnitSetting setting-item"
  >
    <label
      :for="path"
      class="setting-label size-label"
    >
      <slot />
    </label>
    {{ ' ' }}
    <span class="no-break setting-control">
      <input
        :id="path"
        class="input number-input"
        type="number"
        :step="step"
        :disabled="disabled"
        :min="min || 0"
        :value="stateValue"
        @change="updateValue"
      >
      <Select
        :id="path"
        :model-value="stateUnit"
        :disabled="disabled"
        class="unit-input unstyled"
        @change="updateUnit"
      >
        <option
          v-for="option in units"
          :key="option"
          :value="option"
        >
          {{ getUnitString(option) }}
        </option>
      </Select>
    </span>
    {{ ' ' }}
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
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
