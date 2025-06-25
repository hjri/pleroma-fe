<template>
  <div class="EmojiReactions">
    <span
      v-for="(reaction) in emojiReactions"
      :key="reaction.url || reaction.name"
      class="emoji-reaction-container btn-group"
    >
      <component
        :is="loggedIn ? 'button' : 'a'"
        v-bind="!loggedIn ? { href: remoteInteractionLink } : {}"
        role="button"
        class="emoji-reaction btn button-default"
        :class="{ '-picked-reaction': reactedWith(reaction.name), toggled: reactedWith(reaction.name) }"
        :title="reaction.url ? reaction.name : undefined"
        :aria-pressed="reactedWith(reaction.name)"
        @click="emojiOnClick(reaction.name, $event)"
      >
        <span
          class="reaction-emoji"
        >
          <StillImage
            v-if="reaction.url"
            :src="reaction.url"
            class="reaction-emoji-content"
          />
          <span
            v-else
            class="reaction-emoji reaction-emoji-content"
          >{{ reaction.name }}</span>
        </span>
        <FALayers>
          <FAIcon
            v-if="reactedWith(reaction.name)"
            class="active-marker"
            transform="shrink-6 up-9"
            icon="check"
          />
          <FAIcon
            v-if="!reactedWith(reaction.name)"
            class="focus-marker"
            transform="shrink-6 up-9"
            icon="plus"
          />
          <FAIcon
            v-else
            class="focus-marker"
            transform="shrink-6 up-9"
            icon="minus"
          />
        </FALayers>
      </component>
      <UserListPopover
        :users="accountsForEmoji[reaction.name]"
        class="emoji-reaction-popover"
        :normal-button="true"
        :trigger-attrs="counterTriggerAttrs(reaction)"
        @show="fetchEmojiReactionsByIfMissing()"
      >
        <span class="emoji-reaction-counts">{{ reaction.count }}</span>
      </UserListPopover>
    </span>
    <a
      v-if="tooManyReactions"
      class="emoji-reaction-expand faint"
      href="javascript:void(0)"
      @click="toggleShowAll"
    >
      {{ showAll ? $t('general.show_less') : showMoreString }}
    </a>
  </div>
</template>

<script src="./emoji_reactions.js"></script>

<style src="./emoji_reactions.scss" lang="scss" />
