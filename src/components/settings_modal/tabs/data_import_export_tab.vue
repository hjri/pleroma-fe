<template>
  <div
    class="data-import-export-tab"
    :label="$t('settings.data_import_export_tab')"
  >
    <div class="setting-section">
      <h3>{{ $t('settings.import_export.title') }}</h3>
      <ul class="setting-list">
        <li>
          <h4>{{ $t('settings.import_export.follows') }}</h4>
          <p>{{ $t('settings.import_followers_from_a_csv_file') }}</p>
          <div class="importer-exporter">
            <Importer
              :submit-handler="importFollows"
              :success-message="$t('settings.follows_imported')"
              :error-message="$t('settings.follow_import_error')"
            />
            <Exporter
              :get-content="getFollowsContent"
              filename="friends.csv"
              :export-button-label="$t('settings.follow_export_button')"
            />
          </div>
        </li>
        <li>
          <h4>{{ $t('settings.import_export.mutes') }}</h4>
          <p>{{ $t('settings.import_mutes_from_a_csv_file') }}</p>
          <div class="importer-exporter">
            <Importer
              :submit-handler="importMutes"
              :success-message="$t('settings.mutes_imported')"
              :error-message="$t('settings.mute_import_error')"
            />
            <Exporter
              :get-content="getMutesContent"
              filename="friends.csv"
              :export-button-label="$t('settings.mute_export_button')"
            />
          </div>
        </li>
        <li>
          <h4>{{ $t('settings.import_export.blocks') }}</h4>
          <p>{{ $t('settings.import_blocks_from_a_csv_file') }}</p>
          <div class="importer-exporter">
            <Importer
              :submit-handler="importBlocks"
              :success-message="$t('settings.blocks_imported')"
              :error-message="$t('settings.block_import_error')"
            />
            <Exporter
              :get-content="getBlocksContent"
              filename="friends.csv"
              :export-button-label="$t('settings.block_export_button')"
            />
          </div>
        </li>
      </ul>
      <h3>{{ $t('settings.account_backup') }}</h3>
      <div class="setting-list">
        <p>{{ $t('settings.account_backup_description') }}</p>
        <button
          class="btn button-default"
          @click="addBackup"
        >
          {{ $t('settings.add_backup') }}
        </button>
        <p v-if="addedBackup">
          {{ $t('settings.added_backup') }}
        </p>
        <template v-if="addBackupError !== false">
          <p>{{ $t('settings.add_backup_error', { error: addBackupError }) }}</p>
        </template>
      </div>
      <table class="setting-list">
        <thead>
          <tr>
            <th>{{ $t('settings.account_backup_table_head') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="backup in backups"
            :key="backup.id"
          >
            <td>{{ backup.inserted_at }}</td>
            <td class="actions">
              <a
                v-if="backup.processed"
                target="_blank"
                :href="backup.url"
              >
                {{ $t('settings.download_backup') }}
              </a>
              <span
                v-else-if="backup.state === 'running'"
              >
                {{ $t('settings.backup_running', { number: backup.processed_number }, backup.processed_number) }}
              </span>
              <span
                v-else-if="backup.state === 'failed'"
              >
                {{ $t('settings.backup_failed') }}
              </span>
              <span
                v-else
              >
                {{ $t('settings.backup_not_ready') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="listBackupsError"
        class="alert error"
      >
        {{ $t('settings.list_backups_error', { error }) }}
        <button
          :title="$t('settings.hide_list_backups_error_action')"
          @click="listBackupsError = false"
        >
          <FAIcon
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./data_import_export_tab.js"></script>
<style lang="scss" src="./data_import_export_tab.scss"></style>
