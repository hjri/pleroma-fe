<template>
  <vertical-tab-switcher
    v-if="adminDescriptionsLoaded && (noDb || adminDbLoaded)"
    ref="tabSwitcher"
    class="settings-admin-content settings_tab-switcher"
    :side-tab-bar="true"
    :scrollable-tabs
    :render-only-focused="true"
    :body-scroll-lock="bodyLock"
  >
    <div
      v-if="noDb"
      :label="$t('admin_dash.tabs.nodb')"
      icon="exclamation-triangle"
      data-tab-name="nodb-notice"
    >
      <div :label="$t('admin_dash.tabs.nodb')">
        <div class="setting-section">
          <h2>{{ $t('admin_dash.nodb.heading') }}</h2>
          <i18n-t
            scope="global"
            keypath="admin_dash.nodb.text"
          >
            <template #documentation>
              <a
                href="https://docs-develop.pleroma.social/backend/configuration/howto_database_config/"
                target="_blank"
              >
                {{ $t("admin_dash.nodb.documentation") }}
              </a>
            </template>
            <template #property>
              <code>config :pleroma, configurable_from_database</code>
            </template>
            <template #value>
              <code>true</code>
            </template>
          </i18n-t>
          <p>{{ $t('admin_dash.nodb.text2') }}</p>
        </div>
      </div>
    </div>
    <div
      v-if="adminDbLoaded"
      :label="$t('admin_dash.tabs.instance')"
      icon="wrench"
      data-tab-name="general"
    >
      <InstanceTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.users')"
      icon="user"
      data-tab-name="users"
      full-width
      full-height
    >
      <UsersTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.registrations')"
      icon="door-open"
      data-tab-name="registrations"
    >
      <RegistrationsTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.auth')"
      icon="key"
      data-tab-name="monitoring"
    >
      <AuthTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.emoji')"
      icon="face-smile-beam"
      data-tab-name="emoji"
      full-width
    >
      <EmojiTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.frontends')"
      icon="laptop-code"
      data-tab-name="frontends"
      full-width
    >
      <FrontendsTab />
    </div>

    <div
      v-if="adminDbLoaded"
      :label="$t('admin_dash.tabs.limits')"
      icon="hand"
      data-tab-name="limits"
    >
      <LimitsTab />
    </div>

    <div
      v-if="adminDbLoaded"
      :label="$t('admin_dash.tabs.rate_limit')"
      icon="gauge"
      data-tab-name="rate_limits"
    >
      <RatesTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.uploads')"
      icon="upload"
      data-tab-name="uploads"
    >
      <UploadsTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.media_proxy')"
      icon="tower-broadcast"
      data-tab-name="media_proxy"
    >
      <MediaProxyTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.posts')"
      icon="message"
      data-tab-name="other"
    >
      <PostsTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.links')"
      icon="chain"
      data-tab-name="links"
    >
      <LinksTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.mailer')"
      icon="envelope"
      data-tab-name="mailer"
    >
      <MailerTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.federation')"
      icon="circle-nodes"
      data-tab-name="monitoring"
    >
      <FederationTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.http')"
      icon="globe"
      data-tab-name="http"
    >
      <HTTPTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.job_queues')"
      icon="gears"
      data-tab-name="job_queues"
    >
      <JobQueuesTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.monitoring')"
      icon="chart-line"
      data-tab-name="monitoring"
    >
      <MonitoringTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.other')"
      icon="ellipsis"
      data-tab-name="other"
    >
      <OtherTab />
    </div>
  </vertical-tab-switcher>
</template>

<script src="./settings_modal_admin_content.js"></script>

<style lang="scss">
.settings-admin-content {
  .setting-item {
    grid-template-columns: 1fr 3fr;
  }
}
</style>
