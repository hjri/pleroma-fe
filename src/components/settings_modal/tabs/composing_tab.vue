<template>
  <div :label="$t('settings.posts')">
    <div class="setting-section">
      <h3>{{ $t('settings.general') }}</h3>
      <ul class="setting-list">
        <li>
          <label
            class="setting-item "
            for="default-vis"
          >
            <ScopeSelector
              class="scope-selector setting-control"
              :show-all="true"
              :user-default="$store.state.profileConfig.defaultScope"
              :initial-scope="$store.state.profileConfig.defaultScope"
              :on-scope-change="changeDefaultScope"
              :unstyled="false"
            />
          </label>
        </li>
        <li>
          <!-- <BooleanSetting source="profile" path="defaultNSFW"> -->
          <BooleanSetting path="sensitiveByDefault">
            {{ $t('settings.sensitive_by_default') }}
          </BooleanSetting>
        </li>
        <li v-if="postFormats.length > 0">
          <ChoiceSetting
            id="postContentType"
            path="postContentType"
            :options="postContentOptions"
          >
            {{ $t('settings.default_post_status_content_type') }}
          </ChoiceSetting>
        </li>
        <li>
          <BooleanSetting path="padEmoji">
            {{ $t('settings.pad_emoji') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="autocompleteSelect"
            expert="1"
          >
            {{ $t('settings.autocomplete_select_first') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="autoSaveDraft"
          >
            {{ $t('settings.auto_save_draft') }}
          </BooleanSetting>
        </li>
        <li v-if="!mergedConfig.autoSaveDraft">
          <ChoiceSetting
            id="unsavedPostAction"
            path="unsavedPostAction"
            :options="unsavedPostActionOptions"
            expert="1"
          >
            {{ $t('settings.unsaved_post_action') }}
          </ChoiceSetting>
        </li>
      </ul>
      <h3>{{ $t('settings.replies') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            path="scopeCopy"
          >
            {{ $t('settings.scope_copy') }}
          </BooleanSetting>
        </li>
        <li>
          <ChoiceSetting
            id="subjectLineBehavior"
            path="subjectLineBehavior"
            :options="subjectLineOptions"
          >
            {{ $t('settings.subject_line_behavior') }}
          </ChoiceSetting>
        </li>
      </ul>
      <h3 v-if="expertLevel > 0">
        {{ $t('settings.attachments') }}
      </h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            path="imageCompression"
            expert="1"
          >
            {{ $t('settings.image_compression') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="alwaysUseJpeg"
                expert="1"
                parent-path="imageCompression"
              >
                {{ $t('settings.always_use_jpeg') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./composing_tab.js"></script>
