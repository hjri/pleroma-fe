<template>
  <label
    v-if="matchesExpertLevel"
    class="ColorSetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'color'"
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
    <ColorInput
      v-model="visibleState"
      :id="idPrefix + 'color'"
      :name="path"
      class="setting-control color-setting-input"
      :class="{ disabled: shouldBeDisabled }"
      :disabled="shouldBeDisabled"
      :placeholder="realSuggestions"
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
      place-self: end start;
    }

    legend {
      display: none;
    }
  }

  .color-setting-input {
    align-self: baseline;
  }
}
</style>
