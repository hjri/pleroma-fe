<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="setting-item"
  >
    <legend
      v-if="!hideLabel"
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
    </legend>
    {{ ' ' }}
    <span class="setting-control">
      <input
        v-model="a"
        class="input string-input" :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="realSuggestions?.[0]?.[0]"
        :title="realSuggestions?.[0]?.[0]"
      >
      {{ ' ' }}
      <input
        v-model="b"
        class="input string-input"
        :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="realSuggestions?.[0]?.[1]"
        :title="realSuggestions?.[0]?.[1]"
      >
    </span>
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
  </fieldset>
</template>

<script src="./tuple_setting.js"></script>
