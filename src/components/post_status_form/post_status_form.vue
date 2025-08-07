<template>
  <div
    ref="form"
    class="post-status-form"
  >
    <form
      autocomplete="off"
      @submit.prevent
      @dragover.prevent="fileDrag"
    >
      <div class="form-group">
        <i18n-t
          v-if="!$store.state.users.currentUser.locked && newStatus.visibility == 'private' && !disableLockWarning"
          keypath="post_status.account_not_locked_warning"
          tag="p"
          class="visibility-notice"
          scope="global"
        >
          <button
            class="button-unstyled -link"
            @click="openProfileTab"
          >
            {{ $t('post_status.account_not_locked_warning_link') }}
          </button>
        </i18n-t>
        <p
          v-if="!hideScopeNotice && newStatus.visibility === 'public'"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.public') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            :title="$t('post_status.scope_notice_dismiss')"
            role="button"
            tabindex="0"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="!hideScopeNotice && newStatus.visibility === 'unlisted'"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.unlisted') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            :title="$t('post_status.scope_notice_dismiss')"
            role="button"
            tabindex="0"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="!hideScopeNotice && newStatus.visibility === 'private' && $store.state.users.currentUser.locked"
          class="visibility-notice notice-dismissible"
        >
          <span>{{ $t('post_status.scope_notice.private') }}</span>
          <a
            class="fa-scale-110 fa-old-padding dismiss"
            :title="$t('post_status.scope_notice_dismiss')"
            role="button"
            tabindex="0"
            @click.prevent="dismissScopeNotice()"
          >
            <FAIcon icon="times" />
          </a>
        </p>
        <p
          v-else-if="newStatus.visibility === 'direct'"
          class="visibility-notice"
        >
          <span v-if="safeDMEnabled">{{ $t('post_status.direct_warning_to_first_only') }}</span>
          <span v-else>{{ $t('post_status.direct_warning_to_all') }}</span>
        </p>
        <div
          v-if="isEdit"
          class="visibility-notice edit-warning"
        >
          <p>{{ $t('post_status.edit_remote_warning') }}</p>
          <p>{{ $t('post_status.edit_unsupported_warning') }}</p>
        </div>
        <div
          v-if="!disablePreview"
          class="preview-heading faint"
        >
          <a
            class="preview-toggle faint"
            @click.stop.prevent="togglePreview"
          >
            {{ $t('post_status.preview') }}
            <FAIcon :icon="showPreview ? 'chevron-left' : 'chevron-right'" />
          </a>
          <div
            v-show="previewLoading"
            class="preview-spinner"
          >
            <FAIcon
              class="fa-old-padding"
              spin
              icon="circle-notch"
            />
          </div>
          <div
            v-if="quotable"
            role="radiogroup"
            class="btn-group reply-or-quote-selector"
          >
            <button
              :id="`reply-or-quote-option-${randomSeed}-reply`"
              class="btn button-default reply-or-quote-option"
              :class="{ toggled: !newStatus.quoting }"
              tabindex="0"
              role="radio"
              :aria-labelledby="`reply-or-quote-option-${randomSeed}-reply`"
              :aria-checked="!newStatus.quoting"
              @click="newStatus.quoting = false"
            >
              {{ $t('post_status.reply_option') }}
            </button>
            <button
              :id="`reply-or-quote-option-${randomSeed}-quote`"
              class="btn button-default reply-or-quote-option"
              :class="{ toggled: newStatus.quoting }"
              tabindex="0"
              role="radio"
              :aria-labelledby="`reply-or-quote-option-${randomSeed}-quote`"
              :aria-checked="newStatus.quoting"
              @click="newStatus.quoting = true"
            >
              {{ $t('post_status.quote_option') }}
            </button>
          </div>
        </div>
        <div
          v-if="showPreview"
          class="preview-container"
        >
          <div
            v-if="!preview"
            class="preview-status"
          >
            {{ $t('general.loading') }}
          </div>
          <div
            v-else-if="preview.error"
            class="preview-status preview-error"
          >
            {{ preview.error }}
          </div>
          <StatusContent
            v-else
            :status="preview"
            class="preview-status"
          />
        </div>
        <EmojiInput
          v-if="!disableSubject && (newStatus.spoilerText || alwaysShowSubject)"
          v-model="newStatus.spoilerText"
          enable-emoji-picker
          :suggest="emojiSuggestor"
          class="input form-control"
        >
          <template #default="inputProps">
            <input
              v-model="newStatus.spoilerText"
              type="text"
              :placeholder="$t('post_status.content_warning')"
              :disabled="posting && !optimisticPosting"
              v-bind="propsToNative(inputProps)"
              size="1"
              class="input form-post-subject"
            >
          </template>
        </EmojiInput>
        <EmojiInput
          ref="emoji-input"
          v-model="newStatus.status"
          :suggest="emojiUserSuggestor"
          :placement="emojiPickerPlacement"
          class="input form-control main-input"
          enable-sticker-picker
          enable-emoji-picker
          hide-emoji-button
          :newline-on-ctrl-enter="submitOnEnter"
          @input="onEmojiInputInput"
          @sticker-uploaded="addMediaFile"
          @sticker-upload-failed="uploadFailed"
          @shown="handleEmojiInputShow"
        >
          <template #default="inputProps">
            <textarea
              ref="textarea"
              v-model="newStatus.status"
              :placeholder="placeholder || $t('post_status.default')"
              rows="1"
              cols="1"
              :disabled="posting && !optimisticPosting"
              class="input form-post-body"
              :class="{ 'scrollable-form': !!maxHeight }"
              v-bind="propsToNative(inputProps)"
              @keydown.exact.enter="submitOnEnter && postStatus($event, newStatus)"
              @keydown.meta.enter="postStatus($event, newStatus)"
              @keydown.ctrl.enter="!submitOnEnter && postStatus($event, newStatus)"
              @input="resize"
              @compositionupdate="resize"
              @paste="paste"
            />
            <p
              v-if="hasStatusLengthLimit"
              class="character-counter faint"
              :class="{ error: isOverLengthLimit }"
            >
              {{ charactersLeft }}
            </p>
          </template>
        </EmojiInput>
        <div
          v-if="!disableScopeSelector"
          class="visibility-tray"
        >
          <scope-selector
            v-if="!disableVisibilitySelector"
            :show-all="showAllScopes"
            :user-default="userDefaultScope"
            :original-scope="copyMessageScope"
            :initial-scope="newStatus.visibility"
            :on-scope-change="changeVis"
          />

          <div
            v-if="postFormats.length > 1"
            class="text-format"
          >
            <Select
              v-model="newStatus.contentType"
              class="input form-control"
              :attrs="{ 'aria-label': $t('post_status.content_type_selection') }"
            >
              <option
                v-for="postFormat in postFormats"
                :key="postFormat"
                :value="postFormat"
              >
                {{ $t(`post_status.content_type["${postFormat}"]`) }}
              </option>
            </Select>
          </div>
          <div
            v-if="postFormats.length === 1 && postFormats[0] !== 'text/plain'"
            class="text-format"
          >
            <span class="only-format">
              {{ $t(`post_status.content_type["${postFormats[0]}"]`) }}
            </span>
          </div>
        </div>
      </div>
      <poll-form
        v-if="pollsAvailable"
        ref="pollForm"
        :visible="pollFormVisible"
        :params="newStatus.poll"
      />
      <span
        v-if="!disableDraft && shouldAutoSaveDraft"
        class="auto-save-status"
      >
        {{ autoSaveState }}
      </span>
      <div
        ref="bottom"
        class="form-bottom"
      >
        <div class="form-bottom-left">
          <media-upload
            ref="mediaUpload"
            class="media-upload-icon"
            :drop-files="dropFiles"
            :disabled="uploadFileLimitReached"
            @uploading="startedUploadingFiles"
            @uploaded="addMediaFile"
            @upload-failed="uploadFailed"
            @all-uploaded="finishedUploadingFiles"
          />
          <button
            class="emoji-icon button-unstyled"
            :title="$t('emoji.add_emoji')"
            @click="showEmojiPicker"
          >
            <FAIcon icon="smile-beam" />
          </button>
          <button
            v-if="pollsAvailable"
            class="poll-icon button-unstyled"
            :class="{ selected: pollFormVisible }"
            :title="$t('polls.add_poll')"
            @click="togglePollForm"
          >
            <FAIcon icon="poll-h" />
          </button>
        </div>
        <div class="btn-group post-button-group">
          <button
            class="btn button-default post-button"
            :disabled="isOverLengthLimit || posting || uploadingFiles || disableSubmit"
            @click.stop.prevent="postStatus($event, newStatus)"
          >
            <template v-if="posting">
              {{ $t('post_status.posting') }}
            </template>
            <template v-else>
              {{ $t('post_status.post') }}
            </template>
          </button>
          <Popover
            v-if="!hideExtraActions"
            class="more-post-actions"
            :normal-button="true"
            trigger="click"
            placement="bottom"
            :offset="{ y: 5 }"
            :trigger-attrs="{ 'aria-label': $t('post_status.more_post_actions') }"
          >
            <template #trigger>
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="chevron-down"
              />
            </template>
            <template #content="{close}">
              <div
                class="dropdown-menu"
                role="menu"
              >
                <div
                  class="menu-item dropdown-item"
                  :class="{ disabled: !safeToSaveDraft }"
                >
                  <button
                    v-if="!hideDraft || !disableDraft"
                    class="main-button"
                    role="menu"
                    :disabled="!safeToSaveDraft"
                    @click.prevent="saveDraft"
                    @click="close"
                  >
                    <template v-if="closeable">
                      {{ $t('post_status.save_to_drafts_and_close_button') }}
                    </template>
                    <template v-else>
                      {{ $t('post_status.save_to_drafts_button') }}
                    </template>
                  </button>
                </div>
              </div>
            </template>
          </Popover>
        </div>
      </div>
      <div
        v-show="showDropIcon !== 'hide'"
        :style="{ animation: showDropIcon === 'show' ? 'fade-in 0.25s' : 'fade-out 0.5s' }"
        class="drop-indicator"
        @dragleave="fileDragStop"
        @drop.stop="fileDrop"
      >
        <FAIcon :icon="uploadFileLimitReached ? 'ban' : 'upload'" />
      </div>
      <div
        v-if="error"
        class="alert error"
      >
        Error: {{ error }}
        <button
          class="button-unstyled"
          @click="clearError"
        >
          <FAIcon
            class="fa-scale-110 fa-old-padding"
            icon="times"
          />
        </button>
      </div>
      <gallery
        v-if="newStatus.files && newStatus.files.length > 0"
        class="attachments"
        :grid="true"
        :nsfw="false"
        :attachments="newStatus.files"
        :descriptions="newStatus.mediaDescriptions"
        :set-media="() => setMedia()"
        :editable="true"
        :edit-attachment="editAttachment"
        :remove-attachment="removeMediaFile"
        :shift-up-attachment="newStatus.files.length > 1 && shiftUpMediaFile"
        :shift-dn-attachment="newStatus.files.length > 1 && shiftDnMediaFile"
        @play="$emit('mediaplay', attachment.id)"
        @pause="$emit('mediapause', attachment.id)"
      />
      <div
        v-if="newStatus.files.length > 0 && !disableSensitivityCheckbox"
        class="upload_settings"
      >
        <Checkbox v-model="newStatus.nsfw">
          {{ $t('post_status.attachments_sensitive') }}
        </Checkbox>
      </div>
    </form>
    <DraftCloser
      ref="draftCloser"
      @save="saveAndCloseDraft"
      @discard="discardAndCloseDraft"
    />
  </div>
</template>

<script src="./post_status_form.js"></script>

<style src="./post_status_form.scss" lang="scss"></style>
