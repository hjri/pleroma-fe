<template>
  <div class="posts-tab">
    <div class="setting-section">
      <h3>{{ $t('settings.posts_appearance') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="collapseMessageWithSubject" />
        </li>
        <li>
          <BooleanSetting path="widthEfficientPostLayout" />
        </li>
        <li>
          <ChoiceSetting path="conversationDisplay" />
          <ul
            v-if="mergedConfig.conversationDisplay !== 'linear'"
            class="setting-list suboptions"
          >
            <li>
              <BooleanSetting path="conversationTreeAdvanced" />
            </li>
            <li>
              <BooleanSetting path="conversationTreeFadeAncestors" />
            </li>
            <li>
              <IntegerSetting path="maxDepthInThread" />
            </li>
            <li>
              <ChoiceSetting path="conversationOtherRepliesButton" />
            </li>
          </ul>
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.fontPosts"
            name="post"
            fallback="inherit"
            :label="$t('settings.style.fonts.components.post')"
            @update:model-value="v => updateFont('fontPosts', v)"
          />
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.fontMonospace"
            name="postCode"
            fallback="monospace"
            :label="$t('settings.style.fonts.components.monospace')"
            @update:model-value="v => updateFont('fontMonospace', v)"
          />
        </li>
        <li>
          <BooleanSetting path="greentext">
            <i18n-t
              keypath="settings.plaintext_quotes"
              tag="span"
            >
              <span class="greentext">
                {{ $t('settings.greentext_quotes') }}
              </span>
            </i18n-t>
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="emojiReactionsOnTimeline" />
        </li>
      </ul>
      <h3>{{ $t('settings.mention_links') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting path="mentionLinkDisplay" />
          <ul class="setting-list suboptions">
            <li v-if="mergedConfig.mentionLinkDisplay !== 'short'">
              <BooleanSetting path="mentionLinkFadeDomain" />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="mentionLinkShowTooltip" />
        </li>
        <li>
          <BooleanSetting path="mentionLinkShowAvatar" />
        </li>
        <li v-if="user">
          <BooleanSetting path="mentionLinkBoldenYou" />
        </li>
        <li v-if="user">
          <BooleanSetting
            source="profile"
            path="stripRichContent"
            :expert="1"
          >
            {{ $t('settings.no_rich_text_description') }}
          </BooleanSetting>
          <ul
            v-if="mergedConfig.useAbsoluteTimeFormat"
            class="setting-list suboptions"
          >
            <li>
              <UnitSetting path="absoluteTimeFormatMinAge" />
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('settings.attachments') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="stopGifs" />
        </li>
        <li>
          <BooleanSetting path="nonSquareEmoji" />
        </li>
        <li>
          <BooleanSetting path="scaleMfm" />
        </li>
        <li>
          <BooleanSetting path="pauseMfm" />
        </li>
        <li>
          <BooleanSetting path="hideNsfw" />
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting path="preloadImage" />
            </li>
            <li>
              <BooleanSetting path="useOneClickNsfw" />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="loopVideo" />
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="loopVideoSilentOnly"
                :disabled="!loopSilentAvailable"
               />
              <div
                v-if="!loopSilentAvailable"
                class="unavailable"
              >
                <FAIcon icon="globe" />! {{ $t('settings.limited_availability') }}
              </div>
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path="playVideosInModal" />
        </li>
        <li>
          <BooleanSetting path="useContainFit" />
        </li>
      </ul>
      <h3 v-if="expertLevel > 0">
        {{ $t('settings.fun') }}
      </h3>
      <ul
        v-if="expertLevel > 0"
        class="setting-list"
      >
        <li v-if="user">
          <BooleanSetting path="mentionLinkShowYous" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./posts_tab.js"></script>
<style src="./posts_tab.scss"></style>
