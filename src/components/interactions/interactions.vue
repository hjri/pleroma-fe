<template>
  <div class="panel panel-default">
    <div class="panel-heading">
      <h1 class="title">
        {{ $t("nav.interactions") }}
      </h1>
    </div>
    <tab-switcher
      ref="tabSwitcher"
      :on-switch="onModeSwitch"
    >
      <span
        key="statuses"
        :label="$t('nav.mentions')"
      />
      <span
        key="statuses"
        :label="$t('interactions.statuses')"
      />
      <span
        key="likes+repeats"
        :label="$t('interactions.favs_repeats')"
      />
      <span
        key="follows"
        :label="$t('interactions.follows')"
      />
      <span
        key="reactions"
        :label="$t('interactions.emoji_reactions')"
      />
      <span
        v-if="canSeeReports"
        key="reports"
        :label="$t('interactions.reports')"
      />
      <span
        v-if="!allowFollowingMove"
        key="moves"
        :label="$t('interactions.moves')"
      />
    </tab-switcher>
    <Notifications
      ref="notifications"
      :no-extra="true"
      :minimal-mode="true"
      :filter-mode="filterMode"
    />
  </div>
</template>

<script src="./interactions.js"></script>
