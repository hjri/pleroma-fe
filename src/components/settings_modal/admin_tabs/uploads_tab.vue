<template>
  <div :label="$t('admin_dash.tabs.uploads')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.uploads.upload') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            :path="[':pleroma','Pleroma.Upload',':uploader']"
            :options="uploaders"
          />
          <h4>{{ $t('admin_dash.uploads.uploader_settings')}}</h4>
          <ul class="setting-list suboptions">
            <template v-if="uploader === 'Pleroma.Uploaders.Local'">
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.Local',':uploads']"
                />
              </li>
            </template>
            <template v-else-if="uploader === 'Pleroma.Uploaders.IPFS'">
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.IPFS',':get_gateway_url']"
                />
              </li>
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.IPFS',':post_gateway_url']"
                />
              </li>
            </template>
            <template v-else-if="uploader === 'Pleroma.Uploaders.S3'">
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.S3',':bucket']"
                />
              </li>
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.S3',':bucket_namespace']"
                />
              </li>
              <li>
                <BooleanSetting
                  :path="[':pleroma','Pleroma.Uploaders.S3',':streaming_enabled']"
                />
              </li>
              <li>
                <StringSetting
                  :path="[':pleroma','Pleroma.Uploaders.S3',':truncated_namespace']"
                />
              </li>
            </template>
            <li>
              <IntegerSetting
                :path="[':pleroma','Pleroma.Uploaders.Uploader',':timeout']"
              />
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('admin_dash.uploads.attachments') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            path=":pleroma.:instance.:attachment_links"
            :options="uploaders"
          />
        </li>
        <li>
          <BooleanSetting
            path=":pleroma.:instance.:cleanup_attachments"
            :options="uploaders"
          />
        </li>
      </ul>
      <!-- CONFIRM how filters work -->
      <h3>{{ $t('admin_dash.uploads.filenames') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            :path="[':pleroma','Pleroma.Upload',':link_name']"
            :subgroup="adapter"
          />
        </li>
        <li>
          <IntegerSetting
            :path="[':pleroma','Pleroma.Upload',':filename_display_max_length']"
            :subgroup="adapter"
          />
        </li>
        <li>
          <StringSetting
            :path="[':pleroma','Pleroma.Upload',':default_description']"
            :subgroup="adapter"
          />
        </li>
        <li>
          <StringSetting
            :path="[':pleroma','Pleroma.Upload',':base_url']"
            :subgroup="adapter"
          />
        </li>
        <!-- TODO: add mime-type when we have a dynamic list component -->
      </ul>
    </div>
  </div>
</template>

<script src="./uploads_tab.js"></script>
