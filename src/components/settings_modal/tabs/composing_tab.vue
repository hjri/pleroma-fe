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
            <span class="setting-label">
              <ProfileSettingIndicator :is-profile="true" />
              {{ $t('settings.default_vis') }}
            </span>
            <ScopeSelector
              class="scope-selector setting-control"
              :show-all="true"
              :user-default="defaultScope"
              :initial-scope="defaultScope"
              :unstyled="false"
              @change="changeDefaultScope"
            />
          </label>
        </li>
        <li>
          <!-- <BooleanSetting source="profile" path="defaultNSFW"> -->
          <BooleanSetting path="sensitiveByDefault" />
        </li>
        <li v-if="postFormats.length > 0">
          <ChoiceSetting
            path="postContentType"
            :options="postContentOptions"
          />
        </li>
        <li>
          <BooleanSetting path="padEmoji" />
        </li>
        <li>
          <BooleanSetting path="autocompleteSelect" />
        </li>
        <li>
          <BooleanSetting path="autoSaveDraft" />
        </li>
        <li v-if="!mergedConfig.autoSaveDraft">
          <ChoiceSetting path="unsavedPostAction" />
        </li>
      </ul>
      <h3>{{ $t('settings.replies') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="scopeCopy" />
        </li>
        <li>
          <ChoiceSetting path="subjectLineBehavior" />
        </li>
        <li>
          <BooleanSetting path="chatSubmitOnEnter" />
        </li>
      </ul>
      <h3 v-if="expertLevel > 0">
        {{ $t('settings.attachments') }}
      </h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="imageCompression" />
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting path="alwaysUseJpeg" />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./composing_tab.js"></script>
