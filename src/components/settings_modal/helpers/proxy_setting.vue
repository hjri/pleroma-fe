<template>
  <label
    v-if="matchesExpertLevel"
    class="ProxySetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="path"
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
      <template v-if="backendDescriptionLabel">
        {{ backendDescriptionLabel + ' ' }}
      </template>
      <template v-else-if="source === 'admin'">
        MISSING LABEL FOR {{ path }}
      </template>
      <slot v-else />
    </label>
    {{ ' ' }}
    <div class="setting-control">
      <input
        :id="path"
        class="input string-input"
        :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="backendDescriptionSuggestions[0]"
        :value="displayState"
        @change="event => update({ event })"
      >
      {{ ' ' }}
      <Checkbox
        :model-value="socksState"
        :disabled="shouldBeDisabled"
        :indeterminate="isIndeterminate"
        @update:model-value="event => update({ event, isProxy: true})"
      >
        SOCKS5
        {{ ' ' }}
      </Checkbox>
    </div>
    {{ ' ' }}
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <ProfileSettingIndicator :is-profile="isProfileSetting" />
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
  </label>
</template>

<script src="./proxy_setting.js"></script>
