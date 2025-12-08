<template>
  <div
    class="LinksTab"
    :label="$t('admin_dash.tabs.http')"
  >
    <div class="setting-item">
      <h3>{{ $t('admin_dash.http.outbound') }}</h3>
      <ul class="setting-list">
        <li>
          <ProxySetting
            hide-description
            path=":pleroma.:http.:proxy_url"
          />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:http.:send_user_agent" />
        </li>
        <li>
          <StringSetting path=":pleroma.:http.:user_agent" />
        </li>
        <li>
          <ListSetting
            override-available-options
            :options="sslOptions"
            path=":pleroma.:http.:adapter.:ssl_options.:versions"
          />
        </li>
        <li>
          <GroupSetting path=":pleroma.:http.:adapter" />
        </li>
      </ul>
    </div>
    <div class="setting-item">
      <h3>{{ $t('admin_dash.http.incoming') }}</h3>
      <ul class="setting-list">
        <h4>{{ $t('admin_dash.http.cors') }}</h4>
        <li>
          <IntegerSetting
            :description-path-override="[':cors_plug', '<ROOT>', ':max_age']"
            path=":cors_plug.:max_age"
          />
        </li>
        <li>
          <BooleanSetting
            :description-path-override="[':cors_plug', '<ROOT>', ':credentials']"
            path=":cors_plug.:credentials"
          />
        </li>
        <li>
          <ListSetting
            path=":cors_plug.:methods"
            :description-path-override="[':cors_plug', '<ROOT>', ':methods']"
          />
        </li>
        <li>
          <ListSetting
            :description-path-override="[':cors_plug', '<ROOT>', ':expose']"
            path=":cors_plug.:expose"
          />
        </li>
        <li>
          <ListSetting
            :description-path-override="[':cors_plug', '<ROOT>', ':headers']"
            path=":cors_plug.:headers"
          />
        </li>
        <h4>{{ $t('admin_dash.http.security') }}</h4>
        <li>
          <BooleanSetting path=":pleroma.:http_security.:enabled" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:http_security.:sts" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:http_security.:sts_max_age" />
        </li>
        <li>
          <IntegerSetting path=":pleroma.:http_security.:ct_max_age" />
        </li>
        <li>
          <StringSetting path=":pleroma.:http_security.:referrer_policy" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:http_security.:allow_unsafe_eval" />
        </li>
        <li>
          <StringSetting path=":pleroma.:http_security.:report_url" />
        </li>
        <h4>{{ $t('admin_dash.http.web_cache_ttl') }}</h4>
        <p>{{ $t('admin_dash.http.web_cache_ttl_description') }}</p>
        <li>
          <StringSetting path=":pleroma.:web_cache_ttl.:activity_pub" />
        </li>
        <li>
          <StringSetting path=":pleroma.:web_cache_ttl.:activity_pub_question" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.http.web_push') }}</h3>
      <p>{{ $t('admin_dash.http.web_push_description') }}</p>
      <ul class="setting-list">
        <li>
          <StringSetting
            path=":web_push_encryption.:vapid_details.:subject"
          />
        </li>
        <li>
          <StringSetting
            path=":web_push_encryption.:vapid_details.:public_key"
          />
        </li>
        <li>
          <StringSetting
            path=":web_push_encryption.:vapid_details.:private_key"
          />
        </li>
      </ul>
      <!-- CONFIRM admin_token should go there but something is wrong with both data and description. -->
      <!-- given the nature of the setting it's probably better to not expose it and deprecate it on backend side -->
      <!-- CONFIRM :pleroma.:streamer should also PROBABLY? go here but it's completely MIA from backend besides references to config description -->
    </div>
  </div>
</template>

<!--<style lang="scss" src="./http_tab.scss"></style>-->

<script src="./http_tab.js"></script>
