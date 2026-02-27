<template>
  <div
    v-if="matchesExpertLevel"
    class="ListTupleSetting"
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
        v-for="(item, index) in visibleState"
        :key="index"
      >
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item.tuple[0]"
            @change="e => update({ event: e, index, eventType: 'edit', tuple: 0 })"
          >
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item.tuple[1]"
            @change="e => update({ event: e, index, eventType: 'edit', tuple: 1 })"
          >
          <button
            class="button-default"
            @click="e => update({ index, eventType: 'remove' })"
          >
            <FAIcon icon="times" />
          </button>
        </div>
      </li>
      <li>
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
    <DraftButtons />
  </div>
</template>

<script src="./list_tuple_setting.js"></script>
<style lang="scss">
.ListTupleSetting {
  .btn-group {
    display: flex
  }

  dl {
    display: inline-grid;
    grid-template-columns: auto auto;
    gap: 0.5em;
    align-items: baseline;

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
