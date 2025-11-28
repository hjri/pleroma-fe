<template>
  <div :label="$t('admin_dash.tabs.uploads')">
    <div class="setting-item">
      <h3>{{ $t('admin_dash.uploads.general') }}</h3>
      <ul class="setting-list">
        <li>
          <ChoiceSetting
            :path="[':pleroma','Pleroma.Upload']"
            :option-label-map="adaptersLabels"
           />
        </li>
        <h4>{{ $t('admin_dash.mailer.auth') }}</h4>
        <li>
          <!-- authentication info -->
          <StringSetting
            :path="[':pleroma','Pleroma.Emails.Mailer',':api_key']"
            :password="true"
            :subgroup="adapter"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script src="./uploads_tab.js"></script>
