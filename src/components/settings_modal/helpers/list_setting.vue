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
      <li
        class="btn-group"
        v-for="(item, index) in visibleState"
      >
        <input
          class="input string-input"
          :class="{ disabled: shouldBeDisabled }"
          :value="item"
          @change="e => update({event: e, index })"
        >
        <button
          class="button-default"
          @click="e => update({ remove: true, index })"
        >
          <FAIcon icon="times" />
        </button>
      </li>
      <li class="btn-group">
        <input
          class="input string-input"
          :class="{ disabled: shouldBeDisabled }"
          :disabled="shouldBeDisabled"
          v-model="newValue"
        >
        <button
          class="button-default"
          @click="addNew"
        >
          <FAIcon icon="plus" />
        </button>
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
  li.btn-group {
    display: flex
  }
}
</style>
<script src="./list_setting.js"></script>
