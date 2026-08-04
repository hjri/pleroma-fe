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
      />
      <PostStatusForm />
    </div>
    <AuthForm
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

  .user-info {
    margin: 0.6em 0.6em 0;

    .Avatar {
      width: 5em;
      width: calc(min(5em, 20cqw));
      height: 5em;
      height: calc(min(5em, 20cqw));
    }
  }

  .post-status-form {
    margin: 0.5em;
  }

  .signed-in {
    z-index: 10;
  }
}
</style>
