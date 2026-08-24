<template>
  <span
    class="Avatar"
    :class="{ '-compact': compact }"
  >
    <StillImage
      v-if="user"
      class="avatar"
      :alt="user.screen_name_ui"
      :title="user.screen_name_ui"
      :src="url ? url : imgSrc(user.profile_image_url_original)"
      :image-load-error="imageLoadError"
      :class="{ '-compact': compact, '-better-shadow': betterShadow }"
    />
    <div
      v-else
      class="avatar -placeholder"
      :class="{ '-compact': compact }"
    />
    <FAIcon
      v-if="showActorTypeIndicator && user?.actor_type === 'Service'"
      icon="robot"
      class="actor-type-indicator"
    />
    <FAIcon
      v-if="showActorTypeIndicator && user?.actor_type === 'Group'"
      icon="people-group"
      class="actor-type-indicator"
    />
  </span>
</template>

<script src="./user_avatar.js"></script>
<style lang="scss">
.Avatar {
  --_avatarShadowBox: var(--shadow);
  --_avatarShadowFilter: var(--shadowFilter);
  --_avatarShadowInset: var(--shadowInset);
  --_still-image-label-visibility: hidden;

  display: inline-block;
  position: relative;
  width: 3.5em;
  height: 3.5em;

  &.-compact {
    width: 2.2em;
    height: 2.2em;
    border-radius: var(--roundness);
  }

  .avatar {
    width: 100%;
    height: 100%;
    box-shadow: var(--_avatarShadowBox);
    border-radius: var(--roundness);

    &.-better-shadow {
      box-shadow: var(--_avatarShadowInset);
      filter: var(--_avatarShadowFilter);
    }

    &.-animated::before {
      display: none;
    }

    &.-compact {
      border-radius: var(--roundness);
    }

    &.-placeholder {
      background-color: var(--background);
      border: 1px solid var(--border)
    }
  }

  img {
    width: 100%;
    height: 100%;
  }

  .actor-type-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    margin: -0.2em;
    padding: 0.2em;
    background: rgb(127 127 127 / 50%);
    color: #fff;
    border-radius: var(--roundness);
  }
}
</style>
