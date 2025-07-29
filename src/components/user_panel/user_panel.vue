<template>
  <aside class="user-panel">
    <div
      v-if="signedIn"
      key="user-panel-signed"
      class="panel panel-default signed-in"
    >
      <UserCard
        :user-id="user.id"
        :hide-bio="true"
        rounded="top"
      />
      <PostStatusForm />
    </div>
    <auth-form
      v-else
      key="user-panel"
    />
  </aside>
</template>

<script src="./user_panel.js"></script>

<style lang="scss">
.user-panel {
  .panel {
    background: var(--background);
    backdrop-filter: var(--backdrop-filter);
  }

  .other-actions {
    top: -0.6em;
    right: -0.6em;

    a, button, div {
      width: 2em;
      height: 2em;
      line-height: 2em;
    }
  }

  .user-info {
    margin-bottom: -1em;

    .background-image {
      max-height: 5.6em;
      margin-bottom: -4.6em;
    }

    .Avatar {
      width: 5em;
      height: 5em;
    }
  }

  .signed-in {
    z-index: 10;
  }
}
</style>
