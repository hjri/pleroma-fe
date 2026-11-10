<template>
  <div
    v-if="matchesExpertLevel"
    class="BooleanSetting setting-item"
  >
    <span
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator :is-local="isLocalSetting" />
      {{ ' ' }}
      <label :for="idPrefix + 'checkbox'">
        <template v-if="realLabel">
          {{ realLabel }}
        </template>
        <template v-else-if="source === 'admin'">
          MISSING LABEL FOR {{ path }}
        </template>
        <slot v-else />
      </label>
    </span>
    <Checkbox
      :id="idPrefix + 'checkbox'"
      v-model="visibleState"
      class="setting-control"
      :indeterminate="isIndeterminate"
      :disabled="shouldBeDisabled"
    />
    <p
      v-if="realDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <slot name="description">
        {{ realDescription + ' ' }}
      </slot>
    </p>
    <DraftButtons />
  </div>
</template>

<script src="./boolean_setting.js"></script>
