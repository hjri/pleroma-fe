<template>
  <div :label="$t('admin_dash.tabs.limits')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.limits.arbitrary_limits') }}</h3>
      <ul class="setting-list">
        <li>
          <h4>{{ $t('admin_dash.limits.posts') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:instance.:limit" />
            </li>
            <li>
              <IntegerSetting
                path=":pleroma.:instance.:remote_limit"
                :expert="1"
              />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.limits.uploads') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:instance.:description_limit" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:upload_limit" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:max_media_attachments" />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.limits.users') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:instance.:max_pinned_statuses" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:user_bio_length" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:user_name_length" />
            </li>
            <li>
              <h5>{{ $t('admin_dash.limits.profile_fields') }}</h5>
              <ul class="setting-list">
                <li>
                  <IntegerSetting path=":pleroma.:instance.:max_account_fields" />
                </li>
                <li>
                  <IntegerSetting
                    path=":pleroma.:instance.:max_remote_account_fields"
                    expert="1"
                  />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:instance.:account_field_name_length" />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:instance.:account_field_value_length" />
                </li>
              </ul>
            </li>
            <li>
              <h5>{{ $t('admin_dash.limits.user_uploads') }}</h5>
              <ul class="setting-list">
                <li>
                  <IntegerSetting path=":pleroma.:instance.:avatar_upload_limit"
                  />
                </li>
                <li>
                  <IntegerSetting path=":pleroma.:instance.:banner_upload_limit" />
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.limits.other') }}</h4>
          <ul class="setting-list">
            <li>
              <IntegerSetting path=":pleroma.:instance.:max_report_comment_size" />
            </li>
            <li>
              <IntegerSetting path=":pleroma.:instance.:max_endorsed_users" />
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./limits_tab.js"></script>
