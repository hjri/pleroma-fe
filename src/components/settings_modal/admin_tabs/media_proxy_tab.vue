<template>
  <div :label="$t('admin_dash.tabs.media_proxy')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.media_proxy.basic') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:media_proxy.:enabled" />
          <ul
            v-if="mediaProxyEnabled"
            class="setting-list suboptions"
          >
            <li>
              <StringSetting path=":pleroma.:media_proxy.:base_url" />
            </li>
            <li>
              <BooleanSetting path=":pleroma.:media_proxy.:proxy_opts.:redirect_on_failure" />
            </li>
            <li>
              <ListSetting
                ignore-suggestions
                path=":pleroma.:media_proxy.:whitelist"
              />
            </li>
          </ul>
        </li>
      </ul>
      <template v-if="mediaProxyEnabled">
        <h3>{{ $t('admin_dash.media_proxy.invalidation') }}</h3>
        <ul class="setting-list">
          <li>
            <BooleanSetting path=":pleroma.:media_proxy.:invalidation.:enabled" />
            <ul class="setting-list suboptions">
              <li>
                <ChoiceSetting
                  path=":pleroma.:media_proxy.:invalidation.:provider"
                  parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                />
              </li>
              <h4>{{ $t('admin_dash.media_proxy.invalidation_settings') }}</h4>
              <ul class="setting-list suboptions">
                <template v-if="mediaInvalidationProvider === 'Pleroma.Web.MediaProxy.Invalidation.Http'">
                  <li>
                    <StringSetting
                      :path="[':pleroma', 'Pleroma.Web.MediaProxy.Invalidation.Http', ':method']"
                      parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                    />
                  </li>
                  <li>
                    <ListSetting
                      ignore-suggestions
                      :path="[':pleroma', 'Pleroma.Web.MediaProxy.Invalidation.Http', ':headers']"
                      parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                    />
                  </li>
                  <li>
                    <ListSetting
                      :path="[':pleroma', 'Pleroma.Web.MediaProxy.Invalidation.Http', ':options']"
                      parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                    />
                  </li>
                </template>
                <template v-if="mediaInvalidationProvider === 'Pleroma.Web.MediaProxy.Invalidation.Script'">
                  <!-- TODO: you know the drill by now - list component -->
                  <li>
                    <StringSetting
                      :path="[':pleroma', 'Pleroma.Web.MediaProxy.Invalidation.Script', ':script_path']"
                      parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                    />
                  </li>
                  <li>
                    <StringSetting
                      :path="[':pleroma', 'Pleroma.Web.MediaProxy.Invalidation.Script', ':url_format']"
                      parent-path=":pleroma.:media_proxy.:invalidation.:enabled"
                    />
                  </li>
                </template>
              </ul>
            </ul>
          </li>
        </ul>
        <h3>{{ $t('admin_dash.media_proxy.limits') }}</h3>
        <ul class="setting-list">
          <li>
            <IntegerSetting
              path=":pleroma.:media_proxy.:proxy_opts.:max_body_length"
            />
          </li>
          <li>
            <IntegerSetting
              path=":pleroma.:media_proxy.:proxy_opts.:max_read_duration"
            />
          </li>
          <li>
            <GroupSetting path=":pleroma.:media_proxy.:proxy_opts" />
          </li>
        </ul>
        <!-- TODO: add whitelist when we have list component (hehe) -->
        <h3>{{ $t('admin_dash.media_proxy.thumbnails') }}</h3>
        <ul class="setting-list">
          <li>
            <BooleanSetting path=":pleroma.:media_preview_proxy.:enabled" />
            <ul class="setting-list suboptions">
              <li>
                <IntegerSetting
                  parent-path=":pleroma.:media_preview_proxy.:enabled"
                  path=":pleroma.:media_preview_proxy.:image_quality"
                />
              </li>
              <li>
                <IntegerSetting
                  parent-path=":pleroma.:media_preview_proxy.:enabled"
                  path=":pleroma.:media_preview_proxy.:min_content_length"
                />
              </li>
              <li>
                <IntegerSetting
                  parent-path=":pleroma.:media_preview_proxy.:enabled"
                  path=":pleroma.:media_preview_proxy.:thumbnail_max_width"
                />
              </li>
              <li>
                <IntegerSetting
                  parent-path=":pleroma.:media_preview_proxy.:enabled"
                  path=":pleroma.:media_preview_proxy.:thumbnail_max_height"
                />
              </li>
            </ul>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script src="./media_proxy_tab.js"></script>
