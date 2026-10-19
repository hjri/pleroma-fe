<template>
  <div
    v-if="matchesExpertLevel"
    class="ChoiceSetting setting-item"
    :class="{ 'faint': shouldBeDisabled }"
  >
    <div
      class="setting-label"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator :is-local="isLocalSetting" />
      {{ ' ' }}
      <label
        :for="idPrefix + 'select'"
        :id="idPrefix + 'label'"
      >
        <template v-if="backendDescriptionLabel">
          {{ backendDescriptionLabel }}
        </template>
        <template v-else>
          <slot />
        </template>
      </label>
    </div>
    <Select
      class="setting-control"
      :id="idPrefix + 'select'"
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
