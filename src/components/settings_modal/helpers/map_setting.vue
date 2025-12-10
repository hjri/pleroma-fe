<template>
  <div
    v-if="matchesExpertLevel"
    class="MapSetting setting-item"
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
        v-for="(item, i) in displayState"
        :key="i"
      >
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item[0]"
            @change="e => update({ event: e, key: item[0], eventType: 'edit', isKey: true })"
          >
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item[1]"
            @change="e => update({ event: e, key: item[0], eventType: 'edit', isKey: false })"
          >
          <button
            class="button-default"
            @click="e => update({ key: item[0], eventType: 'remove' })"
          >
            <FAIcon icon="times" />
          </button>
        </div>
      </li>
      <li v-if="allowNew">
        <div class="btn-group">
          <input
            v-model="newValue[0]"
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
            :placeholder="backendDescriptionSuggestions[0][0]"
          >
          <input
            v-model="newValue[1]"
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
            :placeholder="backendDescriptionSuggestions[0][1]"
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

<script src="./map_setting.js"></script>
<style lang="scss">
.ListSetting {
  .btn-group {
    display: flex
  }

  dl {
    display: inline-grid;
    grid-template-columns: auto auto;
    gap: 0.5em;

    dt {
      display: inline;
      font-weight: 800;

      &::after {
        content: ':'
      }
    }

    dd {
      display: inline;
      margin: 0
    }
  }
}
</style>
