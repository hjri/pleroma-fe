<template>
  <span
    v-if="matchesExpertLevel"
    class="GroupSetting setting-item"
  >
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <ProfileSettingIndicator :is-profile="isProfileSetting" />
    <DraftButtons />
  </span>
</template>

<script src="./group_setting.js"></script>
