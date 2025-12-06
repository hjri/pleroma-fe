<template>
  <div :label="$t('admin_dash.tabs.job_queues')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.auth.MFA') }}</h3>
      <ul class="setting-list">
        <li>
          <h4>{{ $t('admin_dash.auth.TOTP') }}</h4>
          <ul class="setting-list suboptions">
            <li>
              <IntegerSetting path=":pleroma.:instance.:multi_factor_authentication.:totp.:digits" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:multi_factor_authentication.:totp.:period" />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.auth.backup_codes') }}</h4>
          <ul class="setting-list suboptions">
            <li>
              <IntegerSetting path=":pleroma.:instance.:multi_factor_authentication.:backup_codes.:number" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:multi_factor_authentication.:backup_codes.:length" />
            </li>
          </ul>
        </li>
        <GroupSetting path=":pleroma.:instance.:multi_factor_authentication" />
      </ul>
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
            <!-- CONFIRM old admin FE only supports ONE setting which is Verify, is that correct or should we allow more than one? -->
            <MapSetting
              :allow-new="false"
              path=":pleroma.:ldap.:tlsopts"
            />
          </li>
          <li>
            <BooleanSetting path=":pleroma.:ldap.:ssl" />
          </li>
          <li>
            <!-- CONFIRM old admin FE only supports ONE setting which is Verify, is that correct or should we allow more than one? -->
            <MapSetting
              :allow-new="false"
              path=":pleroma.:ldap.:sslopts"
            />
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
    <!-- CONFIRM admin token is present in AdminFE but missing in both data and descriptions?? -->
  </div>
</template>

<script src="./auth_tab.js"></script>
