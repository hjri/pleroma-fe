<template>
  <div
    v-if="!showNothing"
    class="ScopeSelector btn-group"
  >
    <button
      v-if="showDirect"
      class="scope"
      :class="css.direct"
      :title="$t('post_status.scope.direct')"
      type="button"
      @click="changeVis('direct')"
    >
      <FAIcon
        icon="envelope"
        class="fa-scale-110 fa-old-padding"
      />
    </button>
    {{ ' ' }}
    <button
      v-if="showPrivate"
      class="scope"
      :class="css.private"
      :title="$t('post_status.scope.private')"
      type="button"
      @click="changeVis('private')"
    >
      <FAIcon
        icon="lock"
        class="fa-scale-110 fa-old-padding"
      />
    </button>
    {{ ' ' }}
    <button
      v-if="showUnlisted"
      class="scope"
      :class="css.unlisted"
      :title="$t('post_status.scope.unlisted')"
      type="button"
      @click="changeVis('unlisted')"
    >
      <FAIcon
        icon="lock-open"
        class="fa-scale-110 fa-old-padding"
      />
    </button>
    {{ ' ' }}
    <button
      v-if="showPublic"
      class="scope"
      :class="css.public"
      :title="$t('post_status.scope.public')"
      type="button"
      @click="changeVis('public')"
    >
      <FAIcon
        icon="globe"
        class="fa-scale-110 fa-old-padding"
      />
    </button>
  </div>
</template>

<script src="./scope_selector.js"></script>

<style lang="scss">
.ScopeSelector {
  display: inline-block;

  .scope {
    display: inline-block;
    min-width: 1.3em;
    min-height: 1.3em;
    text-align: center;
    padding: 0.5em 0.25em
  }
}
</style>
