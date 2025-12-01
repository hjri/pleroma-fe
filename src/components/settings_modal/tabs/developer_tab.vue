<template>
  <div
    :label="$t('settings.developer')"
    class="developer-tab"
  >
    <div class="setting-item">
      <h3>{{ $t('settings.version.title') }}</h3>
      <dl class="setting-list">
        <dt>{{ $t('settings.version.backend_version') }}</dt>
        <dd>
          <a
            :href="backendRepository"
            target="_blank"
          >
            {{ backendVersion }}
          </a>
        </dd>
        <dt>{{ $t('settings.version.frontend_version') }}</dt>
        <dd>
          <a
            :href="frontendVersionLink"
            target="_blank"
          >
            {{ frontendVersion }}
          </a>
        </dd>
      </dl>
      <h3>{{ $t('settings.debug') }}</h3>
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
<style lang="scss" src="./developer_tab.scss"></style>
