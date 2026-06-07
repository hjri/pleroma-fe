<template>
  <div :label="$t('admin_dash.tabs.other')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.other.uncategorized') }}</h3>
      <ul class="setting-list">
        <li>
          <StringSetting path=":pleroma.:instance.:static_dir" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:profile_directory" />
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
