<template>
  <div :label="$t('admin_dash.tabs.media_proxy')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.links.link_previews') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:rich_media.:enabled" />
        </li>
        <li>
          <ListSetting
            :override-available-options="parsersOptions"
            path=":pleroma.:rich_media.:parsers"
          />
        </li>
        <li>
          <IntegerSetting
            path=":pleroma.:rich_media.:timeout"
          />
        </li>
        <li>
          <ListSetting
            :override-available-options="ttlSettersOptions"
            path=":pleroma.:rich_media.:ttl_setters"
          />
        </li>
        <li>
          <ListSetting
            path=":pleroma.:rich_media.:ignore_tld"
            ignore-suggestions
          />
        </li>
        <li>
          <ListSetting path=":pleroma.:rich_media.:ignore_hosts" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./links_tab.js"></script>
