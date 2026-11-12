<template>
  <span
    v-if="matchesExpertLevel"
    class="AttachmentSetting setting-item"
    :class="{ '-compact': compact }"
  >
    <label
      v-if="!hideLabel"
      :for="idPrefix + 'file'"
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
    </label>
    {{ ' ' }}
    <p
      v-if="realDescription"
      class="setting-description"
      :class="classes"
    >
      {{ realDescription + ' ' }}
    </p>
    <DraftButtons v-if="!hideDraftButtons" />
    <div class="attachment-input">
      <div class="controls control-field">
        <label for="path">{{ $t('settings.url') }}</label>
        <input
          :id="idPrefix + 'file'"
          class="input string-input"
          :disabled="shouldBeDisabled"
          :value="realDraftMode ? draft : state"
          @change="update"
        >
        {{ ' ' }}
      </div>
      <div v-if="!compact">{{ $t('settings.preview') }}</div>
      <Attachment
        class="attachment"
        :compact="compact"
        :attachment="attachment"
        size="small"
        hide-description
      />
      <div class="controls control-upload">
        <MediaUpload
          ref="mediaUpload"
          class="media-upload-icon"
          normal-button
          :accept-types="acceptTypes"
          @uploaded="setMediaFile"
        />
      </div>
    </div>
  </span>
</template>

<script src="./attachment_setting.js"></script>

<style lang="scss">
.AttachmentSetting {
  .attachment {
    display: block;
    width: 100%;
    height: 15em;
    margin-bottom: 0.5em;
  }

  .attachment-input {
    margin-left: 1em;
    display: flex;
    flex-direction: column;
    width: 20em;
  }

  &.-compact {
    .attachment-input {
      flex-direction: row;
      align-items: flex-end;
    }

    .attachment {
      flex: 0;
      order: 0;
      display: block;
      min-width: 4em;
      height: 4em;
      align-self: center;
      margin-bottom: 0;
    }

    .control-field {
      order: 1;
      min-width: 12em;
      margin-left: 0.5em;
    }

    .control-upload {
      order: 2;
      min-width: 12em;
      padding: 0 0.5em;
    }
  }

  .controls {
    margin-bottom: 0.5em;

    input,
    button {
      width: 100%;
    }
  }
}
</style>
