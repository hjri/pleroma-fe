<template>
  <div class="clutter-tab">
    <div class="setting-section">
      <h3>{{ $t('settings.interface') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="alwaysShowSubjectInput" />
        </li>
        <li>
          <BooleanSetting path="minimalScopesMode" />
        </li>
        <li>
          <BooleanSetting path="hidePostStats" />
        </li>
        <li>
          <BooleanSetting path="hideUserStats" />
        </li>
        <li>
          <BooleanSetting path="hideBotIndication" />
        </li>
        <li>
          <BooleanSetting path="hideScrobbles" />
          <ul class="setting-list suboptions">
            <li>
              <UnitSetting path="hideScrobblesAfter" />
            </li>
            <li v-if="instanceSpecificPanelPresent">
              <BooleanSetting path="hideISP" />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="userCardHidePersonalMarks" />
        </li>
        <li v-if="shoutAvailable">
          <BooleanSetting path="hideShoutbox" />
        </li>
      </ul>
      <h3>{{ $t('settings.attachments') }}</h3>
      <ul class="setting-list">
        <li>
          <IntegerSetting path="maxThumbnails" />
        </li>
        <li>
          <BooleanSetting path="hideAttachments" />
        </li>
        <li>
          <BooleanSetting path="hideAttachmentsInConv" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./clutter_tab.js"></script>
