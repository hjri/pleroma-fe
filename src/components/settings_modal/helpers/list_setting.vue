<template>
  <div
    v-if="matchesExpertLevel"
    class="ListSetting"
  >
    <label
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
    <p
      v-if="backendDescriptionDescription"
      class="setting-description"
      :class="{ 'faint': shouldBeDisabled }"
    >
      {{ backendDescriptionDescription + ' ' }}
    </p>
    <ul class="setting-list">
      <li v-for="item in builtinEntries">
        <Checkbox
          :disabled="shouldBeDisabled"
          :model-value="optionPresent(item.value)"
          @update:model-value="e => update({ event, eventType: 'toggle' })"
        >
          {{ item.label }}
        </Checkbox>
      </li>
      <li v-for="(item, index) in extraEntries">
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item"
            @change="e => update({ event: e, index, eventType: 'edit' })"
          >
          <button
            class="button-default"
            @click="e => update({ index, eventType: 'remove' })"
          >
            <FAIcon icon="times" />
          </button>
        </div>
      </li>
      <li v-if="showNew">
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
            v-model="newValue"
          >
          <button
            class="button-default"
            @click="e => update({ eventType: 'add' })"
          >
            <FAIcon icon="plus" />
          </button>
        </div>
      </li>
    </ul>
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <ProfileSettingIndicator :is-profile="isProfileSetting" />
    <DraftButtons />
  </div>
</template>

<style lang="scss">
.ListSetting {
  .btn-group {
    display: flex
  }
}
</style>
<script src="./list_setting.js"></script>
