<template>
  <label
    v-if="matchesExpertLevel"
    class="ChoiceSetting setting-item"
    :class="{ 'faint': shouldBeDisabled }"
  >
    <span class="setting-label">
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator :is-local="isLocalSetting" />
      {{ ' ' }}
      <template v-if="backendDescriptionLabel">
        {{ backendDescriptionLabel }}
      </template>
      <template v-else>
        <slot />
      </template>
    </span>
    <Select
      class="setting-control"
      :model-value="realDraftMode ? draft : state"
      :disabled="shouldBeDisabled"
      @update:model-value="update"
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
      v-if="backendDescriptionDescription"
      class="setting-description"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
  </label>
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
