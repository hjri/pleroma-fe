<template>
  <span
    v-if="matchesExpertLevel"
    class="NumberSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'text'"
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
    <input
      v-model="visibleState"
      :id="idPrefix + 'text'"
      class="input number-input setting-control"
      :class="classes"
      type="number"
      :step="realStep"
      :disabled="shouldBeDisabled"
      :placeholder="realSuggestions ?? realPlaceholder"
      :min="realMin"
    >
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

<script src="./number_setting.js"></script>
