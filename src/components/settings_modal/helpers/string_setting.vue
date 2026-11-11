<template>
  <span
    v-if="matchesExpertLevel"
    class="StringSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'text'"
      class="setting-label"
      :class="labelClasses"
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
    <input
      :id="idPrefix + 'text'"
      v-model="visibleState"
      class="setting-control input string-input"
      :class="{ disabled: shouldBeDisabled }"
      :disabled="shouldBeDisabled"
      :placeholder="realSuggestions"
      :value="realDraftMode ? draft : state"
    >
    {{ ' ' }}
    <p
      v-if="realDescription"
      class="setting-description"
      :class="labelClasses"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
  </span>
</template>

<script src="./string_setting.js"></script>
