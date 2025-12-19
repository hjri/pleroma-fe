<template>
  <div :label="$t('admin_dash.tabs.mailer')">
    <div class="setting-section">
      <h3>{{ $t('admin_dash.mailer.styling') }}</h3>
      <ul class="setting-list">
        <h4>{{ $t('admin_dash.mailer.assets') }}</h4>
        <li>
          <StringSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':logo']" />
        </li>
        <h4>{{ $t('admin_dash.mailer.colors') }}</h4>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':background_color']" />
        </li>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':content_background_color']" />
        </li>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':header_color']" />
        </li>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':text_color']" />
        </li>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':link_color']" />
        </li>
        <li>
          <ColorSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling', ':text_muted_color']" />
        </li>
        <li>
          <GroupSetting :path="[':pleroma','Pleroma.Emails.UserEmail', ':styling']" />
        </li>
      </ul>
      <h3>{{ $t('admin_dash.mailer.adapter') }}</h3>
      <ul class="setting-list">
        <li>
          <BooleanSetting :path="[':pleroma','Pleroma.Emails.Mailer',':enabled']" />
        </li>
        <template v-if="mailerEnabled">
          <li>
            <ChoiceSetting
              :path="[':pleroma','Pleroma.Emails.Mailer',':adapter']"
              :option-label-map="adaptersLabels"
            />
            <h4>{{ $t('admin_dash.mailer.auth') }}</h4>
            <ul class="setting-list suboptions">
              <li v-if="adapterHasKey(':api_key')">
                <!-- authentication info -->
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':api_key']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':access_key')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':access_key']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':access_token')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':access_token']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':username')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':username']"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':password')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':password']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':secret')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':secret']"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':auth')">
                <ChoiceSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':auth']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>

              <!-- server info -->
              <li v-if="adapterHasKey(':relay')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':relay']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':ssl')">
                <BooleanSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':ssl']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':tls')">
                <ChoiceSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':tls']"
                  :option-label-map="startTLSLabels"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':port')">
                <IntegerSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':port']"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':server_id')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':server_id']"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':region')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':region']"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':domain')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':domain']"
                  :subgroup="adapter"
                />
              </li>

              <!-- sendmail exclusive -->
              <li v-if="adapterHasKey(':cmd_path')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':cmd_path']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':cmd_args')">
                <StringSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':cmd_args']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':qmail')">
                <BooleanSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':qmail']"
                  :password="true"
                  :subgroup="adapter"
                />
              </li>
              <li v-if="adapterHasKey(':retries')">
                <IntegerSetting
                  :path="[':pleroma','Pleroma.Emails.Mailer',':retries']"
                  :subgroup="adapter"
                />
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script src="./mailer_tab.js"></script>
