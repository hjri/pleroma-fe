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
      v-if="backendDescriptionDescription || showDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <slot name="description">
        {{ backendDescriptionDescription + ' ' }}
      </slot>
    </p>
    <DraftButtons />
  </label>
</template>

<script src="./boolean_setting.js"></script>
