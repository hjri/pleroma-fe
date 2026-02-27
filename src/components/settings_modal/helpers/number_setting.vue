<template>
  <span
    v-if="matchesExpertLevel"
    class="NumberSetting setting-item"
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
    <input
      :id="path"
      class="input number-input setting-control"
      type="number"
      :step="step || 1"
      :disabled="shouldBeDisabled"
      :placeholder="backendDescriptionSuggestions"
      :min="min || 0"
      :value="realDraftMode ? draft :state"
      @change="update"
    >
    {{ ' ' }}
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <LocalSettingIndicator :is-local="isLocalSetting" />
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
  </span>
</template>

<script src="./number_setting.js"></script>
