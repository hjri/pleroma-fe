<template>
  <label
    v-if="matchesExpertLevel"
    class="BooleanSetting setting-item"
  >
    <Checkbox
      class="setting-control setting-label"
      :model-value="visibleState"
      :disabled="shouldBeDisabled"
      :indeterminate="isIndeterminate"
      @update:model-value="update"
    >
      <span
        class="label"
        :class="{ 'faint': shouldBeDisabled }"
      >
        <ModifiedIndicator
          :changed="isChanged"
          :onclick="reset"
        />
        <ProfileSettingIndicator :is-profile="isProfileSetting" />
        {{ ' ' }}
        <template v-if="backendDescriptionLabel">
          {{ backendDescriptionLabel }}
        </template>
        <template v-else-if="source === 'admin'">
          MISSING LABEL FOR {{ path }}
        </template>
        <slot v-else />
      </span>
    </Checkbox>
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
    <DraftButtons />
  </label>
</template>

<script src="./boolean_setting.js"></script>

<style lang="scss">
.BooleanSetting {
  display: grid;
  grid-template-columns: subgrid;

  .checkbox {
    display: grid;
    grid-template-columns: subgrid;
  }

  .label {
    grid-area: label;
    text-align: right;
  }

  .-mobile & {
    .label {
      text-align: left;
    }
  }

  .checkbox-indicator {
    grid-area: control;
  }
}
</style>
