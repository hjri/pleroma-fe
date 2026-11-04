<template>
  <div
    class="uploaded-media-tab"
    :label="$t('settings.uploaded_media.title')">

    <div class="setting-section">
      <h3>{{ $t('settings.uploaded_media.title') }}</h3>
    </div>

    <button class="btn button-default" @click="refreshMedia()">{{ $t('settings.uploaded_media.refresh') }}</button>

    <div>
      <div class="media-entry" v-for="media in knownMedia">
        <ul class="setting-list">
          <li>
            <label class="setting-item">
              <span class="setting-label">{{$t('settings.uploaded_media.id')}}</span>
              <input class="input setting-control" :value="media.attachment.id" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">{{$t('settings.uploaded_media.uploaded')}}</span>
              <input class="input setting-control" :value="media.uploaded" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">{{$t('settings.uploaded_media.media_type')}}</span>
              <input class="input setting-control" :value="media.attachment.mimetype" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">{{$t('settings.uploaded_media.media_desc')}}</span>
              <textarea class="input setting-control" :value="media.attachment.description" disabled />
            </label>
          </li>
          <li>
             <label class="setting-item">
               <span class="setting-label">{{$t('settings.uploaded_media.duplicates')}}</span>

               <textarea v-if="media.usage" class="input setting-control" disabled>{{$t('settings.uploaded_media.known_dupes', [media.usage?.duplicates.own ?? 0, media.usage?.duplicates.other ?? 0])}}</textarea>
               <textarea v-else class="input setting-control" disabled>{{$t('settings.uploaded_media.unknown_dupes')}}</textarea>
             </label>
          </li>
          <li>
            <h4>{{$t('settings.uploaded_media.used_in')}}</h4>
            <ul v-if="media.usage" class="used-in-objects-list">
              <li v-for="obj in media.usage.objects">
                <a target="_blank" :href="obj">
                  {{ obj }}
                </a>
              </li>
            </ul>
            <template v-else>
              {{$t('settings.uploaded_media.unknown_dupes')}}
            </template>
          </li>

          <li>
            <div class="media-management-buttons">
              <button class="btn button-default" @click="fetchUsage(media)">{{$t('settings.uploaded_media.fetch_usage')}}</button>
              <button class="btn button-default" @click="showDeleteModal(media)">{{$t('settings.uploaded_media.delete')}}</button>
            </div>
          </li>
        </ul>

        <Attachment
          class="attachment"
          :attachment="media.attachment"
          hide-description
          @set-media="onMediaPreview(media.attachment)"
        />

        <ConfirmModal
          v-if="deleteModalVisible"
          :title="$t('settings.uploaded_media.delete_title')"
          :cancel-text="$t('settings.uploaded_media.cancel_button')"
          :confirm-text="$t('settings.uploaded_media.accept_button')"
          @cancelled="deleteModalVisible = false"
          @accepted="deleteMedia"
        >
          {{ $t('settings.uploaded_media.delete_text') }}
        </ConfirmModal>
      </div>
    </div>

    <div class="text-center load-more" v-if="!noMoreResults">
      <button class="btn button-default" @click="loadMore()">{{ $t('settings.uploaded_media.load_more') }}</button>
    </div>
  </div>
</template>

<script>
  import { remove } from 'lodash-es'

  import Attachment from 'src/components/attachment/attachment.vue'
  import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'

  import { useInterfaceStore } from 'src/stores/interface.js'
  import { useOAuthStore } from 'src/stores/oauth.js'
  import { useMediaViewerStore } from 'src/stores/media_viewer.js'
  import {
    getMedia, uploadedMedia, deleteMedia
  } from 'src/api/user.js'

  const PAGE_SIZE = 50

  export default {
    components: { Attachment, ConfirmModal },
    data() {
      return {
        knownMedia: [],
        deleteModalVisible: false,
        mediaToDelete: 0,
        offset: 0,
        noMoreResults: false
      }
    },
    methods: {
      fetchUsage(media) {
        getMedia({id: media.attachment.id, withUsage: true}).then(result => {
          media.usage = result.data.usage
        })
      },
      showDeleteModal(media) {
        this.deleteModalVisible = true
        this.mediaToDelete = media.attachment.id
      },
      deleteMedia() {
        deleteMedia({
          credentials: useOAuthStore().token, id: this.mediaToDelete
        }).then(result => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: result ? 'settings.uploaded_media.delete_success' : 'settings.uploaded_media.delete_error',
            level: result ? 'success' : 'error'
          })
          this.deleteModalVisible = false

          if (result) {
            remove(this.knownMedia, m => m.attachment.id == this.mediaToDelete)
          }
        }).catch(err => {
          useInterfaceStore().pushGlobalNotice({
            messageKey: 'settings.uploaded_media.delete_error',
            messageArgs: { e: err.statusText },
            level: 'error'
          })
          this.deleteModalVisible = false
        })
      },

      refreshMedia() {
        this.knownMedia = []
        this.offset = 0
        this.noMoreResults = false

        this.loadMore()
      },
      loadMore() {
        uploadedMedia({
          credentials: useOAuthStore().token, offset: this.offset
        }).then(result => {
          if (result.length < PAGE_SIZE)
            this.noMoreResults = true
          this.offset += result.length
          this.knownMedia = this.knownMedia.concat(result)
        })
      },

      onMediaPreview(attachment) {
        useMediaViewerStore().setMedia([attachment])
      }
    },
    mounted() {
      this.refreshMedia()
    }
  }
</script>

<style>
  .uploaded-media-tab {
    .preview-image {
      max-width: 15em;
      max-height: 15em;
    }

    .media-entry {
      padding-top: 1em;

      display: flex;
      gap: 1em;
    }

    .used-in-objects-list {
      overflow-y: auto;
      max-height: 10em;
      min-width: 100%;
    }

    .media-management-buttons {
      margin-top: 1em;
      margin-bottom: 1em;

      display: flex;
      justify-content: space-between;

      gap: 0.5em;
    }
    .media-management-buttons > * {
      flex: auto;
    }

    .load-more {
      margin-top: 1em;
      margin-bottom: 1em;
    }
  }
</style>
