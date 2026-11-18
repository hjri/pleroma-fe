<template>
  <div
    v-if="matchesExpertLevel"
    class="LanguageSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'control'"
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
    <InterfaceLanguageSwitcher
      :id="idPrefix + 'control'"
      v-model="visibleState"
      class="setting-control lang-selector"
      :class="classes"
      :disabled="shouldBeDisabled"
      :placeholder="realSuggestions ?? realPlaceholder"
    />
    <DraftButtons />
    <p
      v-if="realDescription"
      class="setting-description"
    >
      {{ realDescription + ' ' }}
    </p>
  </div>
</template>

<script src="./language_setting.js"></script>
