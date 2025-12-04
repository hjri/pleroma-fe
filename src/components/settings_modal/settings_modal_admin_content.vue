<template>
  <vertical-tab-switcher
    v-if="adminDescriptionsLoaded && (noDb || adminDbLoaded)"
    ref="tabSwitcher"
    class="settings_tab-switcher"
    :side-tab-bar="true"
    :scrollable-tabs="true"
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
        <div class="setting-item">
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
    >
      <EmojiTab />
    </div>

    <div
      :label="$t('admin_dash.tabs.frontends')"
      icon="laptop-code"
      data-tab-name="frontends"
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
      :label="$t('admin_dash.tabs.mailer')"
      icon="envelope"
      data-tab-name="mailer"
    >
      <MailerTab />
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
      :label="$t('admin_dash.tabs.links')"
      icon="chain"
      data-tab-name="links"
    >
      <LinksTab />
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
  </vertical-tab-switcher>
</template>

<script src="./settings_modal_admin_content.js"></script>

<style src="./settings_modal_admin_content.scss" lang="scss"></style>
