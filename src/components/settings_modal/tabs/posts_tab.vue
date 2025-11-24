<template>
  <div class="posts-tab">
    <div class="setting-item">
      <h3>{{ $t('settings.posts_appearance') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="collapseMessageWithSubject">
            {{ $t('settings.collapse_subject') }}
          </BooleanSetting>
        </li>
        <li>
          <ChoiceSetting
            id="conversationDisplay"
            path="conversationDisplay"
            :options="conversationDisplayOptions"
          >
            {{ $t('settings.conversation_display') }}
          </ChoiceSetting>
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.theme3hacks.fonts.post"
            name="post"
            :fallback="{ family: 'inherit' }"
            :label="$t('settings.style.fonts.components.post')"
            @update:model-value="v => updateFont('post', v)"
          />
        </li>
        <li>
          <FontControl
            :model-value="mergedConfig.theme3hacks.fonts.monospace"
            name="postCode"
            :fallback="{ family: 'monospace' }"
            :label="$t('settings.style.fonts.components.monospace')"
            @update:model-value="v => updateFont('monospace', v)"
          />
        </li>
        <ul
          v-if="mergedConfig.conversationDisplay !== 'linear'"
          class="setting-list suboptions"
        >
          <li>
            <BooleanSetting path="conversationTreeAdvanced">
              {{ $t('settings.tree_advanced') }}
            </BooleanSetting>
          </li>
          <li>
            <BooleanSetting
              path="conversationTreeFadeAncestors"
              :expert="1"
            >
              {{ $t('settings.tree_fade_ancestors') }}
            </BooleanSetting>
          </li>
          <li>
            <IntegerSetting
              path="maxDepthInThread"
              :min="3"
              :expert="1"
            >
              {{ $t('settings.max_depth_in_thread') }}
            </IntegerSetting>
          </li>
          <li>
            <ChoiceSetting
              id="conversationOtherRepliesButton"
              path="conversationOtherRepliesButton"
              :options="conversationOtherRepliesButtonOptions"
              :expert="1"
            >
              {{ $t('settings.conversation_other_replies_button') }}
            </ChoiceSetting>
          </li>
        </ul>
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
          <BooleanSetting
            path="emojiReactionsOnTimeline"
            expert="1"
          >
            {{ $t('settings.emoji_reactions_on_timeline') }}
          </BooleanSetting>
        </li>
      </ul>
      <h3>{{ $t('settings.mention_links') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            id="mentionLinkDisplay"
            path="mentionLinkDisplay"
            :options="mentionLinkDisplayOptions"
          >
            {{ $t('settings.mention_link_display') }}
          </ChoiceSetting>
        </li>
        <li>
          <BooleanSetting
            path="mentionLinkShowTooltip"
            expert="1"
          >
            {{ $t('settings.mention_link_use_tooltip') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="mentionLinkShowAvatar">
            {{ $t('settings.mention_link_show_avatar') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            v-if="mergedConfig.mentionLinkDisplay !== 'short'"
            path="mentionLinkFadeDomain"
          >
            {{ $t('settings.mention_link_fade_domain') }}
          </BooleanSetting>
        </li>
        <li v-if="user">
          <BooleanSetting
            path="mentionLinkBoldenYou"
            expert="1"
          >
            {{ $t('settings.mention_link_bolden_you') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            v-if="user"
            source="profile"
            path="stripRichContent"
            expert="1"
          >
            {{ $t('settings.no_rich_text_description') }}
          </BooleanSetting>
        </li>
        <ul
          v-if="mergedConfig.useAbsoluteTimeFormat"
          class="setting-list suboptions"
        >
          <li>
            <UnitSetting
              path="absoluteTimeFormatMinAge"
              unit-set="time"
              :units="['s', 'm', 'h', 'd']"
              :min="0"
            >
              {{ $t('settings.absolute_time_format_min_age') }}
            </UnitSetting>
          </li>
        </ul>
      </ul>
      <h3>{{ $t('settings.attachments') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path="stopGifs">
            {{ $t('settings.stop_gifs') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting path="hideNsfw">
            {{ $t('settings.nsfw_clickthrough') }}
          </BooleanSetting>
        </li>
        <ul class="setting-list suboptions">
          <li>
            <BooleanSetting
              path="preloadImage"
              expert="1"
              parent-path="hideNsfw"
            >
              {{ $t('settings.preload_images') }}
            </BooleanSetting>
          </li>
          <li>
            <BooleanSetting
              path="useOneClickNsfw"
              expert="1"
              parent-path="hideNsfw"
            >
              {{ $t('settings.use_one_click_nsfw') }}
            </BooleanSetting>
          </li>
        </ul>
        <li>
          <BooleanSetting
            path="loopVideo"
            expert="1"
          >
            {{ $t('settings.loop_video') }}
          </BooleanSetting>
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path="loopVideoSilentOnly"
                expert="1"
                parent-path="loopVideo"
                :disabled="!loopSilentAvailable"
              >
                {{ $t('settings.loop_video_silent_only') }}
              </BooleanSetting>
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
          <BooleanSetting
            path="playVideosInModal"
            expert="1"
          >
            {{ $t('settings.play_videos_in_modal') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="useContainFit"
            expert="1"
          >
            {{ $t('settings.use_contain_fit') }}
          </BooleanSetting>
        </li>
        <h3 v-if="expertLevel > 0">
          {{ $t('settings.fun') }}
        </h3>
        <li v-if="user">
          <BooleanSetting
            path="mentionLinkShowYous"
            expert="1"
          >
            {{ $t('settings.show_yous') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./posts_tab.js"></script>
<style src="./posts_tab.scss"></style>
