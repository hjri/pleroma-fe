<template>
  <div
    class="EmojiTab"
    :label="$t('admin_dash.tabs.emoji')"
  >
    <div class="setting-section">
      <h3 class="toolbar">
        <span class="header-text">
          {{ $t('admin_dash.emoji.emoji_packs') }}
        </span>

        <span class="header-buttons btn-group">
          <button
            class="button button-default"
            type="button"
            :title="$t('admin_dash.emoji.reload')"
            @click="reloadEmoji"
          >
            <FAIcon icon="arrows-rotate" />
            {{ $t('admin_dash.emoji.reload_short') }}
          </button>
          <Popover
            popover-class="emoji-tab-edit-popover popover-default"
            trigger="click"
            placement="bottom"
          >
            <template #trigger>
              <button
                class="button button-default"
                type="button"
                :title="$t('admin_dash.emoji.remote_packs')"
              >
                <FAIcon icon="download" />
                {{ $t('admin_dash.emoji.remote_packs_short') }}
              </button>
            </template>
            <template #content>
              <div class="emoji-tab-popover-input">
                <h3>{{ $t('admin_dash.emoji.remote_pack_instance') }}</h3>
                <input
                  v-model="remotePackInstance"
                  class="input"
                  :placeholder="$t('admin_dash.emoji.remote_pack_instance')"
                >
                <button
                  class="button button-default emoji-tab-popover-button"
                  type="button"
                  @click="listRemotePacks"
                >
                  {{ $t('admin_dash.emoji.do_list') }}
                </button>
              </div>
            </template>
          </Popover>

          <Popover
            ref="additionalRemotePopover"
            popover-class="emoji-tab-edit-popover popover-default"
            trigger="click"
            placement="bottom"
          >
            <template #trigger>
              <button
                class="button button-default emoji-panel-additional-actions"
                :title="$t('admin_dash.emoji.import_pack')"
                @click="$refs.additionalRemotePopover.showPopover"
              >
                <FAIcon icon="folder-open" />
                {{ $t('admin_dash.emoji.import_pack_short') }}
              </button>
            </template>

            <template #content>
              <div class="emoji-tab-popover-input">
                <h3>{{ $t('admin_dash.emoji.new_pack_name') }}</h3>
                <input
                  v-model="newPackName"
                  :placeholder="$t('admin_dash.emoji.new_pack_name')"
                  class="input"
                >
                <h3>Import pack from URL</h3>
                <input
                  v-model="remotePackURL"
                  class="input"
                  placeholder="Pack .zip URL"
                >
                <button
                  class="button button-default btn emoji-tab-popover-button"
                  type="button"
                  :disabled="newPackName.trim() === '' || remotePackURL.trim() === ''"
                  @click="downloadRemoteURLPack"
                >
                  Import
                </button>
                <h3>Import pack from a file</h3>
                <input
                  type="file"
                  accept="application/zip"
                  class="emoji-tab-popover-file input"
                  @change="remotePackFile = $event.target.files"
                >
                <button
                  class="button button-default btn emoji-tab-popover-button"
                  type="button"
                  :disabled="newPackName.trim() === '' || remotePackFile === null || remotePackFile.length === 0"
                  @click="downloadRemoteFilePack"
                >
                  Import
                </button>
              </div>
            </template>
          </Popover>
        </span>
      </h3>
      <div class="setting-section">
        <h4 class="toolbar">
          {{ $t('admin_dash.emoji.edit_pack') }}
        </h4>
        <div class="selector-buttons">
          <button
            :disabled="!pack || pack.remote !== undefined"
            class="button button-default btn"
            type="button"
            @click="deleteModalVisible = true"
          >
            {{ $t('admin_dash.emoji.delete_pack') }}

            <ConfirmModal
              v-if="deleteModalVisible"
              :title="$t('admin_dash.emoji.delete_title')"
              :cancel-text="$t('status.delete_confirm_cancel_button')"
              :confirm-text="$t('status.delete_confirm_accept_button')"
              @cancelled="deleteModalVisible = false"
              @accepted="deleteEmojiPack"
            >
              {{ $t('admin_dash.emoji.delete_confirm', [packName]) }}
            </ConfirmModal>
          </button>

          <button
            :disabled="!pack || pack.remote === undefined"
            class="button button-default btn"
            type="button"
            @click="$refs.downloadPackPopover.showPopover"
          >
            {{ $t('admin_dash.emoji.download_pack') }}

            <Popover
              ref="downloadPackPopover"
              trigger="click"
              placement="bottom"
              bound-to-selector=".emoji-tab"
              popover-class="emoji-tab-edit-popover popover-default"
              :bound-to="{ x: 'container' }"
              :offset="{ y: 5 }"
            >
              <template #content>
                <h3>{{ $t('admin_dash.emoji.downloading_pack', [packName]) }}</h3>
                <div>
                  <div>
                    <div class="emoji-tab-popover-input">
                      <label>
                        {{ $t('admin_dash.emoji.download_as_name') }}
                        <input
                          v-model="remotePackDownloadAs"
                          class="emoji-data-input input"
                          :placeholder="$t('admin_dash.emoji.download_as_name_full')"
                        >
                      </label>

                      <div
                        v-if="downloadWillReplaceLocal"
                        class="warning"
                      >
                        <em>{{ $t('admin_dash.emoji.replace_warning') }}</em>
                      </div>
                    </div>

                    <button
                      class="button button-default btn"
                      type="button"
                      @click="downloadRemotePack"
                    >
                      {{ $t('admin_dash.emoji.download') }}
                    </button>
                  </div>
                </div>
              </template>
            </Popover>
          </button>

          <span class="btn-group">
            <Select
              v-model="packName"
              class="form-control"
            >
              <option
                value=""
                disabled
                hidden
              >
                {{ $t('admin_dash.emoji.emoji_pack') }}
              </option>
              <option
                v-for="(pack, listPackName) in knownPacks"
                :key="listPackName"
                :label="listPackName"
              >
                {{ listPackName }}
              </option>
            </Select>

            <Popover
              ref="createPackPopover"
              popover-class="emoji-tab-edit-popover popover-default"
              trigger="click"
              placement="bottom"
            >
              <template #trigger>
                <button
                  class="button button-default btn emoji-tab-popover-button"
                  type="button"
                >
                  {{ $t('admin_dash.emoji.create_pack') }}
                </button>
              </template>
              <template #content>
                <div class="emoji-tab-popover-input">
                  <h3>{{ $t('admin_dash.emoji.new_pack_name') }}</h3>
                  <input
                    v-model="newPackName"
                    :placeholder="$t('admin_dash.emoji.new_pack_name')"
                    class="input"
                  >
                  <button
                    class="button button-default btn emoji-tab-popover-button"
                    type="button"
                    @click="createEmojiPack"
                  >
                    {{ $t('admin_dash.emoji.create') }}
                  </button>
                </div>
              </template>
            </Popover>
          </span>
        </div>
        <h5>
          {{ $t('admin_dash.emoji.metadata') }}

          <ModifiedIndicator
            :changed="$refs.emojiPopovers && $refs.emojiPopovers.some(p => p.isEdited)"
            message-key="admin_dash.emoji.emoji_changed"
          />
        </h5>
        <ul class="setting-list">
          <li>
            <label
              class="setting-item"
              :class="{ ['-disabled']: !pack || pack.remote !== undefined }"
            >
              <span class="setting-label">
                <ModifiedIndicator
                  :changed="metaEdited('description')"
                  message-key="admin_dash.emoji.metadata_changed"
                />
                {{ $t('admin_dash.emoji.description') }}
              </span>
              <div>
                <textarea
                  v-model="packMeta.description"
                  :disabled="!pack || pack.remote !== undefined"
                  class="bio resize-height input setting-control"
                />
              </div>
            </label>
          </li>
          <li>
            <label
              class="setting-item"
              :class="{ ['-disabled']: !pack || pack.remote !== undefined }"
            >
              <span class="setting-label">
                <ModifiedIndicator
                  :changed="metaEdited('homepage')"
                  message-key="admin_dash.emoji.metadata_changed"
                />
                {{ $t('admin_dash.emoji.homepage') }}
              </span>

              <input
                v-model="packMeta.homepage"
                class="emoji-info-input input setting-control"
                :disabled="!pack || pack.remote !== undefined"
              >
            </label>
          </li>
          <li>
            <label
              class="setting-item"
              :class="{ ['-disabled']: !pack || pack.remote !== undefined }"
            >
              <span class="setting-label">
                <ModifiedIndicator
                  :changed="metaEdited('fallback-src')"
                  message-key="admin_dash.emoji.metadata_changed"
                />
                {{ $t('admin_dash.emoji.fallback_src') }}
              </span>

              <input
                v-model="packMeta['fallback-src']"
                class="emoji-info-input input setting-control"
                :disabled="!pack || pack.remote !== undefined"
              >
            </label>
          </li>
          <li>
            <label
              class="setting-item"
              :class="{ ['-disabled']: !pack || pack.remote !== undefined }"
            >
              <span class="setting-label">
                {{ $t('admin_dash.emoji.fallback_sha256') }}
              </span>

              <input
                v-model="packMeta['fallback-src-sha256']"
                :disabled="!pack || pack.remote !== undefined"
                class="emoji-info-input input setting-control"
              >
            </label>
          </li>
          <li>
            <div class="setting-item">
              <Checkbox
                v-model="packMeta['share-files']"
                :disabled="!pack || pack.remote !== undefined"
                class="setting-label setting-control"
              >
              <ModifiedIndicator
                :changed="metaEdited('share-files')"
                message-key="admin_dash.emoji.metadata_changed"
              />
                {{ $t('admin_dash.emoji.share') }}
              </Checkbox>
            </div>
          </li>
          <li>
            <div class="meta-buttons">
              <button
                v-if="pack && pack.remote === undefined"
                class="button button-default btn"
                type="button"
                @click="savePackMetadata"
              >
                {{ $t('admin_dash.emoji.save_meta') }}
              </button>
              <button
                v-if="pack && pack.remote === undefined"
                class="button button-default btn"
                type="button"
                @click="savePackMetadata"
              >
                {{ $t('admin_dash.emoji.revert_meta') }}
              </button>
            </div>
          </li>
        </ul>
        <h5>
          {{ $t('admin_dash.emoji.files') }}

          <ModifiedIndicator
            :changed="$refs.emojiPopovers && $refs.emojiPopovers.some(p => p.isEdited)"
            message-key="admin_dash.emoji.emoji_changed"
          />
        </h5>

        <div
          class="emoji-list setting-list"
        >
          <EmojiEditingPopover
            v-if="pack && pack.remote === undefined"
            placement="bottom"
            new-upload
            :title="$t('admin_dash.emoji.adding_new')"
            :pack-name="packName"
            @update-pack-files="updatePackFiles"
            @display-error="displayError"
          >
            <template #trigger>
              <FAIcon
                icon="plus"
                size="2x"
                :title="$t('admin_dash.emoji.add_file')"
              />
            </template>
          </EmojiEditingPopover>
          <template v-if="!pack">
            <div
              v-for="(_, i) in new Array(20)"
              :key="i"
              class="placeholder"
            />
          </template>


          <EmojiEditingPopover
            v-for="(file, shortcode) in (pack?.files || [])"
            ref="emojiPopovers"
            :key="shortcode"
            placement="top"
            :title="$t(`admin_dash.emoji.${pack?.remote === undefined ? 'editing' : 'copying'}`, [shortcode])"
            :shortcode="shortcode"
            :file="file"
            :pack-name="packName"
            :remote="pack?.remote"
            :known-local-packs="knownLocalPacks"
            @update-pack-files="updatePackFiles"
            @display-error="displayError"
          >
            <template #trigger>
              <StillImage
                class="emoji"
                :src="emojiAddr(file)"
                :title="`:${shortcode}:`"
                :alt="`:${shortcode}:`"
              />
            </template>
          </EmojiEditingPopover>
        </div>
      </div>
      <h3>{{ $t('admin_dash.emoji.advanced') }}</h3>
      <button
        class="button button-default btn"
        type="button"
        @click="importFromFS"
      >
        <FAIcon icon="server" />
        {{ $t('admin_dash.emoji.importFS') }}
      </button>
    </div>
  </div>
</template>

<script src="./emoji_tab.js"></script>

<style lang="scss" src="./emoji_tab.scss"></style>
