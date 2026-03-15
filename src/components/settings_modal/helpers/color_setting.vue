<template>
  <label
    v-if="matchesExpertLevel"
    class="ColorSetting setting-item"
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
      :name="path"
      class="setting-control color-setting-input"
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
  &.setting-item {
    display: grid;
    grid-template-areas:
      "label control"
      ". desc"
      ". draft";

    .setting-label {
      text-align: right;
      align-self: center;
    }

    .setting-control {
      align-self: end;
    }
  }

  .color-setting-input {
    align-self: baseline;
  }
}
</style>
