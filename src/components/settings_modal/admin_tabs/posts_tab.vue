<template>
  <div :label="$t('admin_dash.tabs.posts')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.posts.global') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:instances_favicons.:enabled" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.posts.local') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting path=":pleroma.:instance.:allowed_post_formats" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.posts.remote') }}</h3>
      <ul class="setting-list">
        <li>
          <IntegerSetting path=":pleroma.:instance.:remote_post_retention_days" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:skip_thread_containment" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./posts_tab.js"></script>
