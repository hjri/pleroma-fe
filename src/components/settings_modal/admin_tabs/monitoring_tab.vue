<template>
  <div :label="$t('admin_dash.tabs.monitoring')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.monitoring.mail_digest') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting :path="[':pleroma','Pleroma.Emails.NewUsersDigestEmail',':enabled']" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./monitoring_tab.js"></script>
