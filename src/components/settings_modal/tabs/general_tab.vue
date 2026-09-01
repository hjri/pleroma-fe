<template>
  <div>
    <div class="setting-section">
      <h3>{{ $t('settings.format_and_language') }}</h3>
      <ul class="setting-list">
        <h4>{{ $t('settings.interfaceLanguage') }}</h4>
        <interface-language-switcher
          v-model="language"
          class="lang-selector"
          @update="val => language = val"
        />
        <h5>{{ $t('settings.email_language') }}</h5>
        <interface-language-switcher
          v-model="emailLanguage"
          class="lang-selector"
          :profile="true"
          @update:model-value="updateProfile()"
        />
        <li>
          <BooleanSetting path="useAbsoluteTimeFormat">
            {{ $t('settings.absolute_time_format') }}
          </BooleanSetting>
        </li>
        <li>
          <ChoiceSetting
            id="absoluteTime12h"
            path="absoluteTime12h"
            :options="absoluteTime12hOptions"
          >
            {{ $t('settings.absolute_time_format_12h') }}
          </ChoiceSetting>
        </li>
      </ul>
      <h3>{{ $t('settings.scale_and_font') }}</h3>
      <ul class="setting-list">
        <li>
          <UnitSetting
            path="textSize"
            :step="0.1"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 14, 'rem': 1 }"
            timed-apply-mode
            :local="true"
          >
            {{ $t('settings.text_size') }}
          </UnitSetting>
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
          <FontControl
            :model-value="mergedConfig.fontInterface"
            name="ui"
            :label="$t('settings.style.fonts.components_inline.interface')"
            fallback="sans-serif"
            no-inherit="1"
            @update:model-value="v => updateFont('fontInterface', v)"
          />
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.fontInput"
            name="input"
            fallback="inherit"
            :label="$t('settings.style.fonts.components_inline.input')"
            @update:model-value="v => updateFont('fontInput', v)"
          />
        </li>
        <li>
          <UnitSetting
            path="emojiSize"
            :step="0.1"
            :local="true"
            :units="['px', 'rem']"
            :reset-default="{ 'px': 32, 'rem': 2.2 }"
          >
            {{ $t('settings.emoji_size') }}
          </UnitSetting>
          <ul
            class="setting-list suboptions"
          >
            <li>
              <FloatSetting
                v-if="user"
                path="emojiReactionsScale"
                :local="true"
              >
                {{ $t('settings.emoji_reactions_scale') }}
              </FloatSetting>
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('settings.timelines') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="streaming">
            {{ $t('settings.streaming') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="pauseOnUnfocused"
                parent-path="streaming"
              >
                {{ $t('settings.pause_on_unfocused') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting
            path="useStreamingApi"
            :local="true"
            expert="1"
            @update:model-value="toggleStreaming"
          >
            {{ $t('settings.useStreamingApi') }}
          </BooleanSetting>
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
              <BooleanSetting path="modalOnRepeat">
                {{ $t('settings.confirm_dialogs_repeat') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnUnfollow">
                {{ $t('settings.confirm_dialogs_unfollow') }}
              </BooleanSetting>
            </li>
            <li
              v-if="!blockExpiration"
            >
              <BooleanSetting
                path="modalOnBlock"
              >
                {{ $t('settings.confirm_dialogs_block') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnMuteConversation">
                {{ $t('settings.confirm_dialogs_mute_conversation') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnMuteDomain">
                {{ $t('settings.confirm_dialogs_mute_domain') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnDelete">
                {{ $t('settings.confirm_dialogs_delete') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnLogout">
                {{ $t('settings.confirm_dialogs_logout') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnApproveFollow">
                {{ $t('settings.confirm_dialogs_approve_follow') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnDenyFollow">
                {{ $t('settings.confirm_dialogs_deny_follow') }}
              </BooleanSetting>
            </li>
            <li>
              <BooleanSetting path="modalOnRemoveUserFromFollowers">
                {{ $t('settings.confirm_dialogs_remove_follower') }}
              </BooleanSetting>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./general_tab.js"></script>
