<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="MapSetting setting-item"
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
        v-for="(item, i) in displayState"
        :key="i"
      >
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item[0]"
            :title="realSuggestions[0][0]"
            @change="event => edit({ event, key: item[0], isKey: true })"
          >
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item[1]"
            :title="realSuggestions[0][1]"
            @change="event => edit({ event, key: item[0], isKey: false })"
          >
          <button
            class="button-default"
            @click="e => remove(item[0])"
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
            :placeholder="realSuggestions[0][0]"
            :title="realSuggestions[0][0]"
          >
          <input
            v-model="newValue[1]"
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
            :placeholder="realSuggestions[0][1]"
            :title="realSuggestions[0][1]"
          >
          <button
            class="button-default"
            @click="add"
          >
            <FAIcon icon="plus" />
          </button>
        </div>
      </li>
    </ul>
  </fieldset>
</template>

<script src="./map_setting.js"></script>
<style lang="scss">
.MapSetting {
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
