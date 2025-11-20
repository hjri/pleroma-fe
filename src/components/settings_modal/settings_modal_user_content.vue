<template>
  <vertical-tab-switcher
    ref="tabSwitcher"
    class="settings_tab-switcher"
    :scrollable-tabs="true"
    :body-scroll-lock="bodyLock"
  >
    <div
      :full-width="true"
      :label="$t('settings.general')"
      icon="wrench"
      data-tab-name="general"
    >
      <GeneralTab
        class="inner-tab -middle"
        @too-small="() => nestedTooSmall()"
        @too-big="() => nestedTooBig()"
      />
    </div>
    <div
      :full-width="true"
      :label="$t('settings.appearance')"
      icon="window-restore"
      data-tab-name="appearance"
      :delay-render="true"
    >
      <AppearanceTab
        class="inner-tab -middle"
        @too-small="() => nestedTooSmall()"
        @too-big="() => nestedTooBig()"
      />
    </div>
    <div
      v-if="expertLevel > 0"
      :label="$t('settings.style.themes3.editor.title')"
      icon="palette"
      data-tab-name="style"
      :delay-render="true"
    >
      <StyleTab />
    </div>
    <div
      v-if="expertLevel > 0"
      :label="$t('settings.theme_old')"
      icon="paint-brush"
      data-tab-name="theme"
      :delay-render="true"
    >
      <ThemeTab />
    </div>
    <div
      v-if="isLoggedIn"
      :label="$t('settings.profile_tab')"
      icon="user"
      data-tab-name="profile"
    >
      <ProfileTab />
    </div>
    <div
      v-if="isLoggedIn"
      :label="$t('settings.notifications')"
      icon="bell"
      data-tab-name="notifications"
    >
      <NotificationsTab />
    </div>
    <div
      v-if="isLoggedIn"
      :label="$t('settings.security_tab')"
      icon="lock"
      data-tab-name="security"
    >
      <SecurityTab />
    </div>
    <div
      :label="$t('settings.filtering')"
      icon="filter"
      data-tab-name="filtering"
    >
      <FilteringTab />
    </div>
    <div
      v-if="isLoggedIn"
      :label="$t('settings.mutes_and_blocks')"
      :fullHeight="true"
      icon="eye-slash"
      data-tab-name="mutesAndBlocks"
    >
      <MutesAndBlocksTab />
    </div>
    <div
      v-if="isLoggedIn"
      :label="$t('settings.data_import_export_tab')"
      icon="download"
      data-tab-name="dataImportExport"
    >
      <DataImportExportTab />
    </div>
    <div
      :label="$t('settings.version.title')"
      icon="info"
      data-tab-name="version"
    >
      <VersionTab />
    </div>
  </vertical-tab-switcher>
</template>

<script src="./settings_modal_user_content.js"></script>

<style src="./settings_modal_user_content.scss" lang="scss"></style>
