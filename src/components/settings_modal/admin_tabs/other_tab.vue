<template>
  <div :label="$t('admin_dash.tabs.other')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.other.uncategorized') }}</h3>
      <ul class="setting-list">
        <li>
          <StringSetting path=":pleroma.:instance.:static_dir" />
        </li>
        <li>
          <StringSetting path=":pleroma.:modules.:runtime_dir" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:profile_directory" />
        </li>
        <li>
          <BooleanSetting :path="[':pleroma','Pleroma.Web.ApiSpec.CastAndValidate',':strict']" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.reports') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:instance.:report_strip_status" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.user_backup') }}</h3>
      <ul class="setting-list">
        <li>
          <IntegerSetting :path="[':pleroma','Pleroma.User.Backup',':purge_after_days']" />
        </li>
        <li>
          <IntegerSetting :path="[':pleroma','Pleroma.User.Backup',':limit_days']" />
        </li>
        <!-- CONFIRM what is this?
        <li>
          <StringSetting :path="[':pleroma','Pleroma.User.Backup',':dir']" />
        </li>
        -->
        <li>
          <IntegerSetting :path="[':pleroma','Pleroma.User.Backup',':process_chunk_size']" />
        </li>
        <li>
          <IntegerSetting :path="[':pleroma','Pleroma.User.Backup',':timeout']" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.feed') }}</h3>
      <ul class="setting-list">
        <h4>{{ $t('admin_dash.other.feed_title') }}</h4>
        <li>
          <IntegerSetting path=":pleroma.:feed.:post_title.:max_length" />
        </li>
        <li>
          <StringSetting path=":pleroma.:feed.:post_title.:omission" />
        </li>
        <li>
          <GroupSetting path=":pleroma.:feed.:post_title" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.remote_ip') }}</h3>
      <p>{{ $t('admin_dash.other.remote_ip_description') }}</p>
      <ul class="setting-list">
        <li>
          <BooleanSetting :path="[':pleroma','Pleroma.Web.Plugs.RemoteIp',':enabled']" />
        </li>
        <li>
          <ListSetting :path="[':pleroma','Pleroma.Web.Plugs.RemoteIp',':headers']" />
        </li>
        <li>
          <ListSetting :path="[':pleroma','Pleroma.Web.Plugs.RemoteIp',':proxies']" />
        </li>
        <li>
          <ListSetting :path="[':pleroma','Pleroma.Web.Plugs.RemoteIp',':reserved']" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.mime') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting
            override-backend-description-label="application/activity+json"
            hide-description
            :path="[':mime',':types', 'application/activity+json']"
          />
        </li>
        <li>
          <ListSetting
            override-backend-description-label="application/jrd+json"
            hide-description
            :path="[':mime',':types', 'application/jrd+json']"
          />
        </li>
        <li>
          <ListSetting
            override-backend-description-label="application/ld+json"
            hide-description
            :path="[':mime',':types', 'application/ld+json']"
          />
        </li>
        <li>
          <ListSetting
            override-backend-description-label="application/xml"
            hide-description
            :path="[':mime',':types', 'application/xml']"
          />
        </li>
        <li>
          <ListSetting
            override-backend-description-label="application/xrd+xml"
            hide-description
            :path="[':mime',':types', 'application/xrd+xml']"
          />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.streamer') }}</h3>
      <ul class="setting-list">
        <li>
          <IntegerSetting path=":pleroma.:streamer.:workers" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:streamer.:overflow_workers" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.other.privileges') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting path=":pleroma.:instance.:admin_privileges" />
        </li>
        <li>
          <ListSetting path=":pleroma.:instance.:moderator_privileges" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./other_tab.js"></script>
