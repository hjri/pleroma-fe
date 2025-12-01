<template>
  <label
    v-if="matchesExpertLevel"
    class="MultiCheckboxSetting"
  >
    <h5
      :for="path"
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
    </h5>
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
    <ul class="setting-list">
      <li v-for="option in availableOptions">
        <Checkbox
          :model-value="optionPresent(option.value)"
          :disabled="shouldBeDisabled"
          @update:model-value="e => update({event: e, option: option.value})"
        >
          {{ option.label }}
        </Checkbox>
      </li>
    </ul>
    <div>
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <ProfileSettingIndicator :is-profile="isProfileSetting" />
      <DraftButtons />
    </div>
  </label>
</template>

<script src="./multicheckbox_setting.js"></script>
