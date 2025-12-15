<template>
  <div :label="$t('admin_dash.tabs.instance')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.instance.instance') }}</h3>
      <ul class="setting-list">
        <li>
          <StringSetting path=":pleroma.:instance.:name" />
        </li>
        <li>
          <StringSetting path=":pleroma.:instance.:contact_username" />
        </li>
        <li>
          <StringSetting path=":pleroma.:instance.:email" />
        </li>
        <li>
          <StringSetting path=":pleroma.:instance.:description" />
        </li>
        <li>
          <StringSetting path=":pleroma.:instance.:short_description" />
        </li>
        <li>
          <ListSetting
            force-new
            ignore-suggestions
            path=":pleroma.:instance.:languages"
          />
        </li>
        <li>
          <StringSetting path=":pleroma.:instance.:status_page" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.instance.branding') }}</h3>
      <ul class="setting-list">
        <!-- See https://git.pleroma.social/pleroma/pleroma/-/merge_requests/3963 -->
        <li v-if="adminDraft[':pleroma'][':instance'][':favicon'] !== undefined">
          <AttachmentSetting
            compact
            path=":pleroma.:instance.:favicon"
          />
        </li>
        <li>
          <AttachmentSetting
            compact
            path=":pleroma.:instance.:instance_thumbnail"
          />
        </li>
        <h4>{{ $t('admin_dash.instance.pwa.manifest') }}</H4>
        <li>
          <PWAManifestIconsSetting path=":pleroma.:manifest.:icons" />
        </li>
        <li>
          <ColorSetting hide-draft-buttons path=":pleroma.:manifest.:theme_color" />
        </li>
        <li>
          <ColorSetting hide-draft-buttons path=":pleroma.:manifest.:background_color" />
        </li>
        <li>
          <GroupSetting path=":pleroma.:manifest" />
        </li>
        <li>
          <AttachmentSetting path=":pleroma.:instance.:background_image" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.instance.rich_metadata') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting
            override-available-options
            :options="providersOptions"
            :path="[':pleroma','Pleroma.Web.Metadata', ':providers']"
          />
        </li>
        <li>
          <BooleanSetting
            :path="[':pleroma','Pleroma.Web.Metadata', ':unfurl_nsfw']"
          />
        </li>
      </ul>
    </div>
    <div class="setting-section">
      <h3>{{ $t('admin_dash.instance.access') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting
            override-backend-description
            override-backend-description-label
            path=":pleroma.:instance.:public"
          />
        </li>
        <li>
          <ChoiceSetting
            override-backend-description
            override-backend-description-label
            override-available-options
            :options="limitLocalContentOptions"
            path=":pleroma.:instance.:limit_to_local_content"
          />
        </li>
        <li v-if="expertLevel">
          <h3>{{ $t('admin_dash.instance.restrict.header') }}</h3>
          <p>
            {{ $t('admin_dash.instance.restrict.description') }}
          </p>
          <ul class="setting-list">
            <li>
              <h4>{{ $t('admin_dash.instance.restrict.timelines') }}</h4>
              <ul class="setting-list">
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:timelines.:local"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:timelines.:federated"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <GroupSetting path=":pleroma.:restrict_unauthenticated.:timelines" />
                </li>
              </ul>
            </li>
            <li>
              <h4>{{ $t('admin_dash.instance.restrict.profiles') }}</h4>
              <ul class="setting-list">
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:profiles.:local"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:profiles.:remote"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <GroupSetting path=":pleroma.:restrict_unauthenticated.:profiles" />
                </li>
              </ul>
            </li>
            <li>
              <h4>{{ $t('admin_dash.instance.restrict.activities') }}</h4>
              <ul class="setting-list">
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:activities.:local"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <BooleanSetting
                    path=":pleroma.:restrict_unauthenticated.:activities.:remote"
                    indeterminate-state=":if_instance_is_private"
                    swap-description-and-label
                    hide-description
                  />
                </li>
                <li>
                  <GroupSetting path=":pleroma.:restrict_unauthenticated.:activities" />
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./instance_tab.js"></script>
