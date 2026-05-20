<template>
  <Popover
    trigger="hover"
    placement="top"
    :offset="{ y: 5 }"
  >
    <template #trigger>
      <slot />
    </template>
    <template #content>
      <div class="user-list-popover">
        <template v-if="users.length">
          <a
            v-for="(user) in usersCapped"
            :href="$router.resolve(generateProfileLink(user)).href"
            :key="user.id"
            class="user-list-row"
          >
            <UserAvatar
              :user="user"
              class="avatar-small"
              :compact="true"
            />
            <div class="user-list-names">
              <!-- eslint-disable vue/no-v-html -->
              <RichContent
                class="username"
                :title="'@'+user.screen_name_ui"
                :html="user.name_html"
                :emoji="user.emoji"
                :allow-non-square-emoji="allowNonSquareEmoji"
              />
              <!-- eslint-enable vue/no-v-html -->
              <span class="user-list-screen-name">{{ user.screen_name_ui }}</span><UnicodeDomainIndicator :user="user" />
            </div>
          </a>
        </template>
        <template v-else>
          <FAIcon
            icon="circle-notch"
            spin
            size="3x"
          />
        </template>
      </div>
    </template>
  </Popover>
</template>

<script src="./user_list_popover.js"></script>

<style lang="scss">
.user-list-popover {
  padding: 0.5em;

  --emoji-size: calc(var(--emojiSize, 32px) / 2);

  .user-list-row {
    padding: 0.25em;
    display: flex;
    flex-direction: row;
    color: var(--text);

    .user-list-names {
      display: flex;
      flex-direction: column;
      margin-left: 0.5em;
      min-width: 5em;
    }

    .user-list-screen-name {
      font-size: 0.65em;
    }
  }
}

</style>
