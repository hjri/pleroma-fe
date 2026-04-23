<template>
  <span
    v-if="matchesExpertLevel"
    class="GroupSetting setting-item"
  >
    <ModifiedIndicator
      :changed="isChanged"
      :onclick="reset"
    />
    <LocalSettingIndicator :is-local="isLocalSetting" />
    <DraftButtons />
  </span>
</template>

<script src="./group_setting.js"></script>
