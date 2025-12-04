<template>
  <div :label="$t('admin_dash.tabs.job_queues')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.auth.OAuth') }}</h3>
      <ul class="setting-list">
        <li>
          <StringSetting path=":pleroma.:auth.:auth_template" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:auth.:enforce_oauth_admin_scope_usage" />
        </li>
        <li>
          <StringSetting path=":pleroma.:auth.:oauth_consumer_template" />
        </li>
        <li>
          <ListSetting path=":pleroma.:auth.:oauth_consumer_strategies" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:oauth2.:token_expires_in" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:oauth2.:issue_new_refresh_token" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:oauth2.:clean_expired_tokens" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.auth.LDAP') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:ldap.:enabled" />
        </li>
        <template v-if="LDAPEnabled">
          <li>
            <StringSetting path=":pleroma.:ldap.:host" />
          </li>
          <li>
            <IntegerSetting path=":pleroma.:ldap.:port" />
          </li>
          <li>
            <BooleanSetting path=":pleroma.:ldap.:tls" />
          </li>
          <li>
            <ListTupleSetting tuple path=":pleroma.:ldap.:tlsopts" />
          </li>
          <li>
            <BooleanSetting path=":pleroma.:ldap.:ssl" />
          </li>
          <li>
            <ListTupleSetting tuple path=":pleroma.:ldap.:sslopts" />
          </li>
          <li>
            <StringSetting path=":pleroma.:ldap.:base" />
          </li>
          <li>
            <StringSetting path=":pleroma.:ldap.:uid" />
          </li>
          <li>
            <StringSetting path=":pleroma.:ldap.:cacertfile" />
          </li>
          <li>
            <StringSetting path=":pleroma.:ldap.:mail" />
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script src="./auth_tab.js"></script>
