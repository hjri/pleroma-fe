<template>
  <div class="clutter-tab">
    <div class="setting-section">
      <h3>{{ $t('settings.interface') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="alwaysShowSubjectInput">
            {{ $t('settings.subject_input_always_show') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="minimalScopesMode">
            {{ $t('settings.minimal_scopes_mode') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="hidePostStats">
            {{ $t('settings.hide_post_stats') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="hideUserStats">
            {{ $t('settings.hide_user_stats') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="hideBotIndication">
            {{ $t('settings.hide_actor_type_indication') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="hideScrobbles">
            {{ $t('settings.hide_scrobbles') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <UnitSetting
                key="hideScrobblesAfter"
                path="hideScrobblesAfter"
                :units="['m', 'h', 'd']"
                unit-set="time"
              >
                {{ $t('settings.hide_scrobbles_after') }}
              </UnitSetting>
            </li>
            <li v-if="instanceSpecificPanelPresent">
              <BooleanSetting path="hideISP">
                {{ $t('settings.hide_isp') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('settings.attachments') }}</h3>
      <ul class="setting-list">
        <li>
          <IntegerSetting
            path="maxThumbnails"
            :min="0"
          >
            {{ $t('settings.max_thumbnails') }}
          </IntegerSetting>
        </li>
        <li>
          <BooleanSetting
            :local="true"
            path="hideAttachments"
          >
            {{ $t('settings.hide_attachments_in_tl') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            :local="true"
            path="hideAttachmentsInConv"
          >
            {{ $t('settings.hide_attachments_in_convo') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="userCardHidePersonalMarks">
            {{ $t('settings.user_card_hide_personal_marks') }}
          </BooleanSetting>
        </li>
        <li v-if="shoutAvailable">
          <BooleanSetting path="hideShoutbox">
            {{ $t('settings.hide_shoutbox') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./clutter_tab.js"></script>
