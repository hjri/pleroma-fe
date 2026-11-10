<template>
  <label
    v-if="matchesExpertLevel"
    class="ProxySetting setting-item"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'input'"
      :id="idPrefix + 'label'"
      class="setting-label"
      :class="{ 'faint': shouldBeDisabled }"
    >
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
        :value="displayState"
      >
      {{ ' ' }}
      <Checkbox
        v-model="socksField"
        :disabled="shouldBeDisabled"
        :indeterminate="isIndeterminate"
        style="margin-left: 1em"
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
    <DraftButtons v-if="!hideDraftButtons" />
    <p
      v-if="realDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ realDescription + ' ' }}
    </p>
  </label>
</template>

<script src="./proxy_setting.js"></script>
