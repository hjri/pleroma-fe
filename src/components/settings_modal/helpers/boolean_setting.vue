<template>
  <div
    v-if="matchesExpertLevel"
    class="BooleanSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'checkbox'"
      class="setting-label"
      :class="classes"
    >
      <SettingIndicators
        :is-changed="isChanged"
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
    <Checkbox
      :id="idPrefix + 'checkbox'"
      v-model="visibleState"
      class="setting-control"
      :indeterminate="isIndeterminate"
      :disabled="shouldBeDisabled"
    />
    {{ ' ' }}
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      <slot name="description">
        {{ realDescription + ' ' }}
      </slot>
    </p>
  </div>
</template>

<script src="./boolean_setting.js"></script>
