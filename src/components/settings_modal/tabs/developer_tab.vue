<template>
  <div :label="$t('settings.developer')">
    <div class="setting-item">
      <ul class="setting-list">
        <li>
          <p>{{ $t('settings.version.backend_version') }}</p>
          <ul class="option-list">
            <li>
              <a
                :href="backendRepository"
                target="_blank"
              >{{ backendVersion }}</a>
            </li>
          </ul>
        </li>
        <li>
          <p>{{ $t('settings.version.frontend_version') }}</p>
          <ul class="option-list">
            <li>
              <a
                :href="frontendVersionLink"
                target="_blank"
              >{{ frontendVersion }}</a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
    <div class="setting-item">
      <ul class="setting-list">
        <li>
          <BooleanSetting path="virtualScrolling">
            {{ $t('settings.virtual_scrolling') }}
          </BooleanSetting>
        </li>
        <li>
          <button
            class="btn button-default"
            @click="clearAssetCache"
          >
            {{ $t('settings.clear_asset_cache') }}
          </button>
        </li>
        <li>
          <button
            class="btn button-default"
            @click="clearEmojiCache"
          >
            {{ $t('settings.clear_emoji_cache') }}
          </button>
        </li>
        <li>
          <BooleanSetting
            path="themeDebug"
            :expert="1"
          >
            {{ $t('settings.theme_debug') }}
          </BooleanSetting>
        </li>
        <li>
          <BooleanSetting
            path="forceThemeRecompilation"
            :expert="1"
          >
            {{ $t('settings.force_theme_recompilation_debug') }}
          </BooleanSetting>
        </li>
      </ul>
    </div>
  </div>
</template>
<script src="./developer_tab.js" />
