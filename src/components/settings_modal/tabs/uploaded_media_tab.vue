<template>
  <div
    class="uploaded-media-tab"
    :label="$t('settings.uploaded_media.title')"
    v-if="mediaManagementAvailable">

    <div class="setting-section">
      <h3>{{ $t('settings.uploaded_media.title') }}</h3>
    </div>

    <button class="btn button-default" @click="refreshMedia()">{{ $t('settings.uploaded_media.refresh') }}</button>

    <div>
      <div class="media-entry" v-for="media in knownMedia" key="media.attachment.id">
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
               <span v-else-if="media.loadingUsages" class="settings-control" >
                 <FAIcon
                   class="fa-old-padding"
                   spin
                   icon="circle-notch"
                 />
               </span>
               <textarea v-else class="input setting-control" disabled>{{$t('settings.uploaded_media.unknown_dupes')}}</textarea>
             </label>
          </li>
          <li>
            <h4>{{$t('settings.uploaded_media.used_in')}}</h4>
            <ul v-if="media.usage" class="used-in-objects-list">
              <li v-for="obj in media.usage.objects" key="obj">
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
              <button class="btn button-default" :disabled="media.loadingUsages || media.usage" @click="fetchUsage(media)">{{$t('settings.uploaded_media.fetch_usage')}}</button>
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
  <div v-else class="uploaded-media-tab" :label="$t('settings.uploaded_media.title')">
    <div class="setting-section">
      <h3>{{ $t('settings.uploaded_media.title') }}</h3>
    </div>

    <div>{{ $t('settings.uploaded_media.unavailable') }}</div>
  </div>
</template>

<script src="./uploaded_media_tab.js"></script>

<style lang="scss" src="./uploaded_media_tab.scss"></style>
