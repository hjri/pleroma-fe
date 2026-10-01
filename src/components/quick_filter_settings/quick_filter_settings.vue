<template>
  <Popover
    :trigger="nested ? 'hover' : 'click'"
    class="QuickFilterSettings"
    :bound-to="{ x: 'container' }"
    :position="nested ? 'right' : 'top'"
    v-bind="triggerAttrs"
  >
    <template #content>
      <div
        class="dropdown-menu"
        role="menu"
      >
        <div
          v-if="loggedIn"
          role="group"
        >
          <div class="menu-item dropdown-item -icon">
            <button
              v-if="!conversation"
              class="main-button"
              :aria-checked="replyVisibilityAll"
              role="menuitemradio"
              @click="replyVisibilityAll = true"
            >
              <span
                class="input menu-checkbox -radio"
                :class="{ 'menu-checkbox-checked': replyVisibilityAll }"
                :aria-hidden="true"
              />{{ $t('settings.reply_visibility_all') }}
            </button>
          </div>
          <div
            v-if="!conversation"
            class="menu-item dropdown-item -icon"
          >
            <button
              class="main-button"
              :aria-checked="replyVisibilityFollowing"
              role="menuitemradio"
              @click="replyVisibilityFollowing = true"
            >
              <span
                class="input menu-checkbox -radio"
                :class="{ 'menu-checkbox-checked': replyVisibilityFollowing }"
                :aria-hidden="true"
              />{{ $t('settings.reply_visibility_following_short') }}
            </button>
          </div>
          <div
            v-if="!conversation"
            class="menu-item dropdown-item -icon"
          >
            <button
              class="main-button"
              :aria-checked="replyVisibilitySelf"
              role="menuitemradio"
              @click="replyVisibilitySelf = true"
            >
              <span
                class="input menu-checkbox -radio"
                :class="{ 'menu-checkbox-checked': replyVisibilitySelf }"
                :aria-hidden="true"
              />{{ $t('settings.reply_visibility_self_short') }}
            </button>
          </div>
          <hr
            v-if="!conversation"
            role="separator"
            class="dropdown-divider"
          />
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="muteBotStatuses"
            @click="muteBotStatuses = !muteBotStatuses"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': muteBotStatuses }"
              :aria-hidden="true"
            />{{ $t('settings.mute_bot_posts') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="muteSensitiveStatuses"
            @click="muteSensitiveStatuses = !muteSensitiveStatuses"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': muteSensitiveStatuses }"
              :aria-hidden="true"
            />{{ $t('settings.mute_sensitive_posts') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="hideMedia"
            @click="hideMedia = !hideMedia"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': hideMedia }"
              :aria-hidden="true"
            />{{ $t('settings.hide_media_previews') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitemcheckbox"
            :aria-checked="hideMutedPosts"
            @click="hideMutedPosts = !hideMutedPosts"
          >
            <span
              class="input menu-checkbox"
              :class="{ 'menu-checkbox-checked': hideMutedPosts }"
              :aria-hidden="true"
            />{{ $t('settings.hide_all_muted_posts') }}
          </button>
        </div>
        <div class="menu-item dropdown-item -icon">
          <button
            class="main-button"
            role="menuitem"
            @click="openTab('filtering')"
          >
            <FAIcon
              fixed-width
              icon="font"
            />{{ $t('settings.word_filter_and_more') }}
          </button>
        </div>
      </div>
    </template>
    <template #trigger>
      <div :class="mobileLayout ? 'main-button' : ''">
        <FAIcon
          icon="filter"
          :fixed-width="nested"
        />
        <template v-if="nested">
          {{ $t('timeline.filter_settings') }}
        </template>
        <FAIcon
          v-if="nested"
          class="chevron-icon"
          size="lg"
          icon="chevron-right"
          fixed-width
        />
      </div>
    </template>
  </Popover>
</template>

<script src="./quick_filter_settings.js"></script>
