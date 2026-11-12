<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="ListSetting setting-item"
  >
    <legend
      v-if="!hideLabel"
      class="setting-label"
      :class="classes"
    >
      <ModifiedIndicator
        :changed="isChanged"
        :onclick="reset"
      />
      <LocalSettingIndicator
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
    </legend>
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
    <ul class="setting-list">
      <li
        v-for="(item, i) in builtinEntries"
        :key="i"
      >
        <Checkbox
          :disabled="shouldBeDisabled"
          :model-value="optionPresent(item.value)"
          @update:model-value="event => toggle(event, item.value)"
        >
          {{ item.label }}
        </Checkbox>
      </li>
      <li
        v-for="(item, index) in extraEntries"
        :key="index"
      >
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item"
            @change="event => edit(event, index)"
          >
          <button
            class="button-default"
            @click="e => remove(index)"
          >
            <FAIcon icon="times" />
          </button>
        </div>
      </li>
      <li v-if="showNew">
        <div class="btn-group">
          <input
            v-model="newValue"
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
          >
          <button
            class="button-default"
            @click="e => add()"
          >
            <FAIcon icon="plus" />
          </button>
        </div>
      </li>
    </ul>
  </fieldset>
</template>

<script src="./list_setting.js"></script>
<style lang="scss">
.ListSetting {
  border: none;
  margin: 0;

  legend {
    float: left;
  }

  .setting-list {
    align-self: center;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
}
</style>
