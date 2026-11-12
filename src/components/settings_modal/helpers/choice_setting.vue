<template>
  <div
    v-if="matchesExpertLevel"
    class="ChoiceSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'select'"
      class="setting-label"
      :class="classes"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator
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
    <Select
      v-model="visibleState"
      class="setting-control"
      :class="classes"
      :id="idPrefix + 'select'"
      :disabled="shouldBeDisabled"
      :placeholder="localizedPlaceholder"
    >
      <option
        v-for="option in realOptions"
        :key="option.key"
        :value="option.value"
      >
        {{ option.label }}
        {{ option.value === defaultState ? $t('settings.instance_default_simple') : '' }}
      </option>
    </Select>
    <DraftButtons />
    <p
      v-if="realDescription"
      class="setting-description"
    >
      {{ realDescription + ' ' }}
    </p>
  </div>
</template>

<script src="./choice_setting.js"></script>

<style lang="scss">
.ChoiceSetting.setting-item {
  .-mobile & {
    display: block;

    .setting-label {
      display: block;
      margin-bottom: 0.5em
    }
  }
}
</style>
