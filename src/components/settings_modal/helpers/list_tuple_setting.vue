<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="ListTupleSetting"
  >
    <legend
      v-if="!hideLabel"
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
    </legend>
    {{ ' ' }}
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
        v-for="(item, index) in visibleState"
        :key="index"
      >
        <div class="btn-group">
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item.tuple[0]"
            :title="realSuggestions?.[0]?.[0]"
            @change="event => edit(event, index, 0)"
          >
          <input
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :value="item.tuple[1]"
            :title="realSuggestions?.[0]?.[1]"
            @change="event => edit(event, index, 1)"
          >
          <button
            class="button-default"
            @click="e => remove(index)"
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
            :placeholder="realSuggestions?.[0]?.[0]"
            :title="realSuggestions?.[0]?.[0]"
          >
          <input
            v-model="newValue[1]"
            class="input string-input"
            :class="{ disabled: shouldBeDisabled }"
            :disabled="shouldBeDisabled"
            :placeholder="realSuggestions?.[0]?.[1]"
            :title="realSuggestions?.[0]?.[1]"
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
