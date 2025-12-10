<template>
  <div :label="$t('admin_dash.tabs.instance')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.instance.registrations') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting path=":pleroma.:instance.:registrations_open" />
          <ul class="setting-list suboptions">
            <li>
              <BooleanSetting
                path=":pleroma.:instance.:invites_enabled"
                parent-path=":pleroma.:instance.:registrations_open"
                parent-invert
              />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:birthday_required" />
          <ul class="setting-list suboptions">
            <li>
              <IntegerSetting
                path=":pleroma.:instance.:birthday_min_age"
                parent-path=":pleroma.:instance.:birthday_required"
              />
            </li>
          </ul>
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:account_activation_required" />
        </li>
        <li>
          <BooleanSetting path=":pleroma.:instance.:account_approval_required" />
        </li>
        <li>
          <h4>{{ $t('admin_dash.instance.captcha_header') }}</h4>
          <ul class="setting-list">
            <li>
              <BooleanSetting :path="[':pleroma', 'Pleroma.Captcha', ':enabled']" />
              <ul class="setting-list suboptions">
                <li>
                  <ChoiceSetting
                    :path="[':pleroma', 'Pleroma.Captcha', ':method']"
                    :parent-path="[':pleroma', 'Pleroma.Captcha', ':enabled']"
                    :option-label-map="{
                      'Pleroma.Captcha.Native': $t('admin_dash.captcha.native'),
                      'Pleroma.Captcha.Kocaptcha': $t('admin_dash.captcha.kocaptcha')
                    }"
                  />
                  <IntegerSetting
                    :path="[':pleroma', 'Pleroma.Captcha', ':seconds_valid']"
                    :parent-path="[':pleroma', 'Pleroma.Captcha', ':enabled']"
                  />
                </li>
                <li
                  v-if="adminDraft[':pleroma']['Pleroma.Captcha'][':enabled'] && adminDraft[':pleroma']['Pleroma.Captcha'][':method'] === 'Pleroma.Captcha.Kocaptcha'"
                >
                  <h5>{{ $t('admin_dash.instance.kocaptcha') }}</h5>
                  <ul class="setting-list">
                    <li>
                      <StringSetting :path="[':pleroma', 'Pleroma.Captcha.Kocaptcha', ':endpoint']" />
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('admin_dash.registrations.autofollow') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting
            path=":pleroma.:instance.:autofollowed_nicknames"
          />
        </li>
        <li>
          <ListSetting
            path=":pleroma.:instance.:autofollowing_nicknames"
          />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.registrations.welcome.title') }}</h3>
      <ul class="setting-list">
        <p>{{ $t('admin_dash.registrations.welcome.description') }}</p>
        <li>
          <h4>{{ $t('admin_dash.registrations.welcome.direct_message') }}</h4>
          <ul class="setting-list">
            <li>
              <BooleanSetting
                path=":pleroma.:welcome.:direct_message.:enabled"
              />
              <ul class="setting-list suboptions">
                <li>
                  <StringSetting
                    path=":pleroma.:welcome.:direct_message.:sender_nickname"
                    parent-path=":pleroma.:welcome.:direct_message.:enabled"
                  />
                </li>
                <li>
                  <StringSetting
                    path=":pleroma.:welcome.:direct_message.:message"
                    parent-path=":pleroma.:welcome.:direct_message.:enabled"
                  />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:welcome.:direct_message" />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.registrations.welcome.chat_message') }}</h4>
          <ul class="setting-list">
            <li>
              <BooleanSetting
                path=":pleroma.:welcome.:chat_message.:enabled"
              />
              <ul class="setting-list suboptions">
                <li>
                  <StringSetting
                    tuple
                    path=":pleroma.:welcome.:chat_message.:sender_nickname"
                    parent-path=":pleroma.:welcome.:chat_message.:enabled"
                  />
                </li>
                <li>
                  <StringSetting
                    path=":pleroma.:welcome.:chat_message.:message"
                    parent-path=":pleroma.:welcome.:chat_message.:enabled"
                  />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:welcome.:chat_message" />
            </li>
          </ul>
        </li>
        <li>
          <h4>{{ $t('admin_dash.registrations.welcome.email_message') }}</h4>
          <ul class="setting-list">
            <li>
              <BooleanSetting
                path=":pleroma.:welcome.:email.:enabled"
              />
              <ul class="setting-list suboptions">
                <li>
                  <TupleSetting
                    path=":pleroma.:welcome.:email.:sender"
                    parent-path=":pleroma.:welcome.:email.:enabled"
                  />
                </li>
                <li>
                  <StringSetting
                    path=":pleroma.:welcome.:email.:subject"
                    parent-path=":pleroma.:welcome.:email.:enabled"
                  />
                </li>
                <li>
                  <StringSetting
                    path=":pleroma.:welcome.:email.:html"
                    parent-path=":pleroma.:welcome.:email.:enabled"
                  />
                </li>
              </ul>
              <GroupSetting path=":pleroma.:welcome.:email" />
            </li>
          </ul>
        </li>
      </ul>
      <h3>{{ $t('admin_dash.registrations.restrictions') }}</h3>
      <ul class="setting-list">
        <li>
          <ListSetting
            ignore-suggestions
            :path="[':pleroma', 'Pleroma.User', ':email_blacklist']"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./registrations_tab.js"></script>
