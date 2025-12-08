<template>
  <div
    v-if="matchesExpertLevel"
    class="PWAManifestIconsSetting"
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
        <div>
          <dl>
            <dt><code>purpose</code></dt>
            <dd>
              <input
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':purpose']"
                @change="e => update({ event: e, index, eventType: 'edit', field: ':purpose' })"
              >
            </dd>
            <dt><code>sizes</code></dt>
            <dd>
              <input
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':sizes']"
                @change="e => update({ event: e, index, eventType: 'edit', field: ':sizes' })"
              >
            </dd>
            <dt><code>src</code></dt>
            <dd>
              <input
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':src']"
                @change="e => update({ event: e, index, eventType: 'edit', field: ':src' })"
              >
            </dd>
            <dt><code>type</code></dt>
            <dd>
              <input
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':type']"
                @change="e => update({ event: e, index, eventType: 'edit', field: ':type' })"
              >
            </dd>
          </dl>
          <div class="buttons">
            <button
              v-if="index === visibleState.length - 1"
              class="button-default add-button"
              @click="e => update({ eventType: 'add' })"
            >
              <FAIcon icon="plus" />
            </button>
            <button
              class="button-default delete-button"
              @click="e => update({ index, eventType: 'remove' })"
            >
              <FAIcon icon="times" />
            </button>
          </div>
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

<script src="./pwa_manifest_icons_setting.js"></script>
<style lang="scss">
.PWAManifestIconsSetting {
  display: inline-block;

  .setting-list {
    display: grid;
    gap: 0.5em;
  }

  .buttons {
    display: flex;
    gap: 0.5em;
    justify-content: right;
    margin-top: 0.5em;

    button {
      line-height: 2;
    }
  }

  dl {
    display: inline-grid;
    grid-template-columns: auto auto;
    gap: 0.5em;
    align-items: baseline;

    dt {
      display: inline;
      font-weight: 800;
      text-align: right;

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
