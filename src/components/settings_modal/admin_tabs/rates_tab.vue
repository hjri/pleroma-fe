<template>
  <div :label="$t('admin_dash.tabs.instance')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.rate_limit.account_confirmation_resend') }}</h3>
      <ul class="setting-list">
        <li>
          <RateSetting path=":pleroma.:rate_limit.:account_confirmation_resend" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:ap_routes" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:app_account_creation" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:authentication" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:oauth_app_creation" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:relation_id_action" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:search" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:status_id_action" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:statuses_actions" />
        </li>
        <li>
          <RateSetting path=":pleroma.:rate_limit.:timeline" />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./rates_tab.js"></script>
