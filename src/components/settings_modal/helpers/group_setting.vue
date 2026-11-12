<template>
  <span
    v-if="matchesExpertLevel"
    class="GroupSetting setting-item"
  >
    <SettingIndicators
      :is-changed="isChanged"
      :is-local="isLocalOnly"
      :is-overriden="isOverriden"
    />
    <DraftButtons v-if="!hideDraftButtons" />
  </span>
</template>

<script src="./group_setting.js"></script>
