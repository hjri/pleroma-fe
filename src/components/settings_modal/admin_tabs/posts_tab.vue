<template>
  <div :label="$t('admin_dash.tabs.posts')">
    <div class="setting-item">
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
        <li>
          <h4>{{ $t('admin_dash.posts.scheduled_activites') }}</h4>
          <ul class="setting-list">
            <li>
              <BooleanSetting :path="[':pleroma', 'Pleroma.ScheduledActivity', ':enabled']" />
            </li>
            <li>
              <IntegerSetting :path="[':pleroma', 'Pleroma.ScheduledActivity', ':daily_user_limit']" />
            </li>
            <li>
              <IntegerSetting :path="[':pleroma', 'Pleroma.ScheduledActivity', ':total_user_limit']" />
            </li>
          </ul>
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
