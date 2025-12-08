<template>
  <label
    v-if="matchesExpertLevel"
    class="ColorSetting"
  >
    <label
      v-if="!hideLabel"
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
    </label>
    {{ ' ' }}
    <ColorInput
      :id="path"
      class="color-setting-input"
      :class="{ disabled: shouldBeDisabled }"
      :disabled="shouldBeDisabled"
      :placeholder="backendDescriptionSuggestions"
      :model-value="realDraftMode ? draft : state"
      @update:model-value="update"
    />
    {{ ' ' }}
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <ProfileSettingIndicator :is-profile="isProfileSetting" />
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
  </label>
</template>

<script src="./color_setting.js"></script>
<style lang="scss">
.ColorSetting {
  .color-setting-input {
    vertical-align: middle;
  }
}
</style>
