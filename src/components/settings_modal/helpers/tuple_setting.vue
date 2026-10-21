<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="setting-item"
  >
    <legend
      v-if="!hideLabel"
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator :is-local="isLocalSetting" />
      {{ ' ' }}
      <template v-if="backendDescriptionLabel">
        {{ backendDescriptionLabel + ' ' }}
      </template>
      <template v-else-if="source === 'admin'">
        MISSING LABEL FOR {{ path }}
      </template>
      <slot v-else />
    </legend>
    <span class="setting-control">
      <input
        class="input string-input" :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="backendDescriptionSuggestions?.[0]?.[0]"
        :title="backendDescriptionSuggestions?.[0]?.[0]"
        :value="visibleState?.tuple?.[0]"
        @change="e => update({ e, side: 0 })"
      >
      {{ ' ' }}
      <input
        class="input string-input"
        :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="backendDescriptionSuggestions?.[0]?.[1]"
        :title="backendDescriptionSuggestions?.[0]?.[1]"
        :value="visibleState?.tuple?.[1]"
        @change="e => update({ e, side: 1 })"
      >
    </span>
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
  </fieldset>
</template>

<script src="./tuple_setting.js"></script>
