<template>
  <aside
    class="instance-specific-panel"
    :aria-label="$t('nav.instance-specific-panel')"
  >
    <div class="panel panel-default">
      <div class="panel-body">
        <!-- eslint-disable vue/no-v-html -->
        <div v-html="instanceSpecificPanelContent" />
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
  </aside>
</template>

<script src="./instance_specific_panel.js"></script>

<style lang="scss">
  .instance-specific-panel .panel-body {
    border-radius: var(--roundness);
  }
</style>
