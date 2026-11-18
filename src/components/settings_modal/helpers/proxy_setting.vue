<template>
  <label
    v-if="matchesExpertLevel"
    class="ProxySetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'input'"
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
    <div class="setting-control">
      <input
        :id="idPrefix + 'input'"
        v-model="urlField"
        class="input string-input"
        :class="{ disabled: shouldBeDisabled }"
        :disabled="shouldBeDisabled"
        :placeholder="realSuggestions[0]"
      >
      {{ ' ' }}
      <Checkbox
        v-model="socksField"
        :disabled="shouldBeDisabled"
        style="margin-left: 1em"
      >
        SOCKS5
        {{ ' ' }}
      </Checkbox>
    </div>
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

<script src="./proxy_setting.js"></script>
