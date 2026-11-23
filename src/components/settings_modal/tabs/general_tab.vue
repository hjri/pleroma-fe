<template>
  <div>
    <div class="setting-section">
      <h3>{{ $t('settings.format_and_language') }}</h3>
      <ul class="setting-list">
        <li>
          <LanguageSetting path="interfaceLanguage" />
        </li>
        <li>
          <LanguageSetting
            path="emailLanguage"
            source="profile"
            single
          >
            {{ $t('settings.email_language') }}
          </LanguageSetting>
        </li>
        <li>
          <BooleanSetting path="useAbsoluteTimeFormat" />
        </li>
        <li>
          <ChoiceSetting path="absoluteTime12h" />
        </li>
      </ul>
      <h3>{{ $t('settings.scale_and_font') }}</h3>
      <ul class="setting-list">
        <li>
          <UnitSetting path="textSize" />
          <p class="sidenote">
            <i18n-t
              scope="global"
              keypath="settings.text_size_tip"
              tag="span"
            >
              <code>px</code>
              <code>rem</code>
            </i18n-t>
            <br>
            <i18n-t
              scope="global"
              keypath="settings.text_size_tip2"
              tag="span"
            >
              <code>14px</code>
            </i18n-t>
          </p>
        </li>
        <li>
          <FontSetting
            path="fontInterface"
            no-inherit
          />
        </li>
        <li>
          <FontSetting path="fontInput" />
        </li>
        <li>
          <UnitSetting path="emojiSize" />
          <ul
            v-if="user"
            class="setting-list suboptions"
          >
            <li>
              <FloatSetting path="emojiReactionsScale" />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="underlineLinks" />
        </li>
      </ul>
      <h3>{{ $t('settings.timelines') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="streaming" />
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting path="pauseOnUnfocused" />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting
            path="useStreamingApi"
            @update:model-value="toggleStreaming"
          />
        </li>
        <li>
          <BooleanSetting path="timelinePagination" />
        </li>
      </ul>
      <h3 v-if="expertLevel > 0">
        {{ $t('settings.confirmations') }}
      </h3>
      <ul
        v-if="expertLevel > 0"
        class="setting-list"
      >
        <li class="select-multiple">
          <h4 class="label">
            {{ $t('settings.confirm_dialogs') }}
          </h4>
          <ul class="option-list">
            <li>
              <BooleanSetting path="modalOnRepeat" />
            </li>
            <li>
              <BooleanSetting path="modalOnUnfollow" />
            </li>
            <li
              v-if="!blockExpiration"
            >
              <BooleanSetting path="modalOnBlock" />
            </li>
            <li>
              <BooleanSetting path="modalOnMuteConversation" />
            </li>
            <li>
              <BooleanSetting path="modalOnMuteDomain" />
            </li>
            <li>
              <BooleanSetting path="modalOnDelete" />
            </li>
            <li>
              <BooleanSetting path="modalOnLogout" />
            </li>
            <li>
              <BooleanSetting path="modalOnApproveFollow" />
            </li>
            <li>
              <BooleanSetting path="modalOnDenyFollow" />
            </li>
            <li>
              <BooleanSetting path="modalOnRemoveUserFromFollowers" />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./general_tab.js"></script>
