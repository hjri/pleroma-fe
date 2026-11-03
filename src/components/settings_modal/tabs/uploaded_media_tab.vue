<template>
  <div
    class="uploaded-media-tab"
    :label="$t('settings.uploaded_media_tab')">

    <div class="setting-section">
      <h3>{{ $t('settings.uploaded_media.title') }}</h3>
    </div>

    <button class="btn button-default" @click="refreshMedia()">Refresh</button>

    <div>
      <div class="media-entry" v-for="media in knownMedia">
        <ul class="setting-list">
          <li>
            <label class="setting-item">
              <span class="setting-label">ID</span>
              <input class="input setting-control" :value="media.id" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">Uploaded</span>
              <input class="input setting-control" :value="media.uploaded" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">Media type</span>
              <input class="input setting-control" :value="media.mediaType" disabled/>
            </label>
          </li>
          <li>
            <label class="setting-item">
              <span class="setting-label">Media description</span>
              <textarea class="input setting-control" :value="media.name" disabled />
            </label>
          </li>
          <li>
             <label class="setting-item">
               <span class="setting-label">Duplicates</span>

               <textarea v-if="media.usage" class="input setting-control" disabled>Own: {{ media.usage?.duplicates.own ?? 0 }}, Other: {{ media.usage?.duplicates.other ?? 0 }}</textarea>
               <textarea v-else class="input setting-control" disabled>Unknown</textarea>
             </label>
          </li>
          <li>
            <h4>Used in</h4>
            <ul v-if="media.usage" class="used-in-objects-list">
              <li v-for="obj in media.usage.objects">
                <a target="_blank" :href="obj">
                  {{ obj }}
                </a>
              </li>
            </ul>
            <template v-else>
              Unknown
            </template>
          </li>

          <li>
            <label class="setting-item">
              <button class="btn button-default" @click="fetchUsage(media)">Fetch usage</button>
              <button class="btn button-default" @click="showDeleteModal(media)">Delete</button>
            </label>
          </li>
        </ul>

        <img v-if="media.mediaType.startsWith('image/')" class="preview-image" :src="media.href" />
        <audio controls v-if="media.mediaType.startsWith('audio/')" :src="media.href" />
        <video controls v-if="media.mediaType.startsWith('video/')" class="preview-image" :src="media.href" />

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
  </div>
</template>

<script>
  import { remove } from 'lodash-es'

  import Attachment from 'src/components/attachment/attachment.vue'
  import ConfirmModal from 'src/components/confirm_modal/confirm_modal.vue'

  import { useInterfaceStore } from 'src/stores/interface.js'
  import { useOAuthStore } from 'src/stores/oauth.js'
  import {
    getMedia, uploadedMedia, deleteMedia
  } from 'src/api/user.js'

  export default {
    components: { Attachment, ConfirmModal },
    data() {
      return {
        knownMedia: [],
        deleteModalVisible: false,
        mediaToDelete: 0
      }
    },
    methods: {
      fetchUsage(media) {
        getMedia({id: media.id, withUsage: true}).then(result => {
          media.usage = result.data.usage
        })
      },
      showDeleteModal(media) {
        this.deleteModalVisible = true
        this.mediaToDelete = media.id
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
            remove(this.knownMedia, m => m.id == this.mediaToDelete)
          }
        })
      },

      refreshMedia() {
        this.knownMedia = []
        uploadedMedia({
          credentials: useOAuthStore().token
        }).then(result => {
          for (let m of result) {
            this.knownMedia.push(m)
          }
        })
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
  }
</style>
