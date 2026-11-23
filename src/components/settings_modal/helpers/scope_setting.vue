<template>
  <span
    v-if="matchesExpertLevel"
    class="ScopeSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'text'"
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
    <ScopeSelector
      class="scope-selector setting-control"
      :class="classes"
      show-all
      :user-default="visibleState"
      :initial-scope="visibleState"
      :unstyled="false"
      @change="e => visibleState = e"
    />
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

<script src="./scope_setting.js"></script>
