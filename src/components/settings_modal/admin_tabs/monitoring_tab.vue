<template>
  <div :label="$t('admin_dash.tabs.monitoring')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.monitoring.builtins') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting :path="[':pleroma','Pleroma.Emails.NewUsersDigestEmail',':enabled']" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:healthcheck" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.monitoring.prometheus') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting :path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':enabled']" />
        </li>
        <li>
          <BooleanSetting
            :parent-path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':enabled']"
            :path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':auth']"
          />
        </li>
        <li>
          <StringSetting
            :parent-path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':enabled']"
            :path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':path']"
          />
        </li>
        <li>
          <ChoiceSetting
            :parent-path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':enabled']"
            :path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':format']"
          />
        </li>
        <li>
          <ListSetting
            :parent-path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':enabled']"
            :path="[':prometheus','Pleroma.Web.Endpoint.MetricsExporter',':ip_whitelist']"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./monitoring_tab.js"></script>
