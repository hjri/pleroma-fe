<template>
  <fieldset
    v-if="matchesExpertLevel"
    class="PWAManifestIconsSetting setting-item"
  >
    <legend
      v-if="!hideLabel"
      class="pwa-label setting-label"
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
    {{ ' ' }}
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
    <div class="setting-control">
      <ul class="item-list">
        <li
          v-if="visibleState.length === 0"
          class="no_items"
        >
          {{ $t('admin_dash.instance.pwa.no_icons') }}
          <button
            v-if="visibleState.length === 0"
            class="button-default add-button"
            @click="e => add()"
          >
            <FAIcon icon="plus" />
          </button>
        </li>
        <li
          v-for="(item, index) in visibleState"
          :key="index"
          class="icon-element"
        >
          <div class="src-field">
            <Attachment
              class="src-attachment"
              :compact="true"
              :attachment="attachment(item)"
              size="small"
              hide-description
            />
            <div class="src-url">
              <label :for="idPrefix + 'url' + index">{{ $t('settings.url') }}</label>
              <input
                :id="idPrefix + 'url' + index"
                class="input string-input"
                :disabled="shouldBeDisabled"
                :value="item[':src']"
                @change="event => edit(event, index, ':src')"
              >
            </div>
            <MediaUpload
              ref="mediaUpload"
              class="src-upload media-upload-icon"
              :class="{ disabled: shouldBeDisabled }"
              normal-button
              accept-types="image"
              @uploaded="event => setMediaFile({ event, index })"
            />
          </div>
          <dl class="properties">
            <dt>{{ $t('admin_dash.instance.pwa.icon.purpose') }}</dt>
            <dd>
              <Select
                :id="idPrefix + 'purpose' + index"
                :class="{ disabled: shouldBeDisabled }"
                :disabled="shouldBeDisabled"
                :model-value="item[':purpose']"
                @update:model-value="event => setPurpose({ event, index })"
              >
                <option
                  v-for="(purpose, index2) in purposeOptions"
                  :key="index2"
                  :value="purpose.value"
                >
                  {{ purpose.label }}
                </option>
              </Select>
            </dd>
            <dt>
              <label :for="idPrefix + 'sizes' + index">
                <code>sizes</code>{{ $t('admin_dash.instance.pwa.optional') }}
              </label>
            </dt>
            <dd>
              <input
                :id="idPrefix + 'sizes' + index"
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':sizes']"
                @change="e => edit(event, index, ':sizes')"
              >
            </dd>
            <dt>
              <label :for="idPrefix + 'type' + index">
                <code>type</code>{{ $t('admin_dash.instance.pwa.optional') }}
              </label>
            </dt>
            <dd>
              <input
                :id="idPrefix + 'type' + index"
                class="input string-input"
                :class="{ disabled: shouldBeDisabled }"
                :value="item[':type']"
                @change="e => edit(event, index, ':type')"
              >
            </dd>
          </dl>
          <div class="buttons">
            <button
              v-if="index === visibleState.length - 1"
              class="button-default add-button"
              @click="e => add()"
            >
              <FAIcon icon="plus" />
            </button>
            <button
              class="button-default delete-button"
              @click="e => remove(index)"
            >
              <FAIcon icon="times" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </fieldset>
</template>

<script src="./pwa_manifest_icons_setting.js"></script>
<style lang="scss">
fieldset.PWAManifestIconsSetting {
  margin-left: 3em;

  &.setting-item {
    display: grid;
    grid-template-areas:
      "label"
      "desc"
      "draft"
      "control";
    grid-template-rows: 2em auto 1fr;
    grid-template-columns: 1fr;
  }

  .setting-control {
    margin-top: 1em;
  }

  .pwa-label.setting-label {
    align-self: end;
    text-align: left;
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

  ul {
    flex: 1;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, 12em);
    gap: 2em;
  }

  input {
    width: 100%;
  }

  .src-field {
    display: grid;
    grid-template-columns: auto;
    justify-items: center;
    gap: 0.5em;

    .src-attachment {
      width: 10em;
      height: 10em;
      display: block;
      margin-bottom: 0.5em;
    }

    .src-upload {
      display: block;
      width: 100%;
    }

    .src-url {
      display: flex;
      flex-direction: column;
      gap: 0.25em;
      width: 100%;

      label {
        display: block;
      }
    }
  }

  .properties {
    display: grid;
    grid-template-columns: 1fr;
    margin-top: 0.5em;
    gap: 0.25em;
    align-items: baseline;

    dt {
      font-weight: 800;

      &::after {
        content: ':'
      }
    }

    dd {
      margin: 0;
    }
  }
}
</style>
