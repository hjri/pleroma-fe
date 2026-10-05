<template>
<div
  class="ActivityHeader"
  :class="{ '-multiline': multiline }"
>
    <template
      v-if="user"
    >
      <RichContent
        v-if="user.name_html"
        class="user-title"
        :html="user.name"
        :emoji="user.emoji"
        :allow-non-square-emoji="allowNonSquareEmoji"
        :is-local="user.is_local"
        :title="user.name"
      />
      <span
        v-else
        class="status-username"
        :title="user.name"
      >
        {{ user.name }}
      </span>
      {{ ' ' }}
      <span class="user-handle">
        <UserLink
          :title="user.screen_name_ui"
          :user="user"
          :at="false"
        />
        <img
          v-if="!!(user && user.favicon)"
          class="instance-favicon"
          :title="$t('status.favicon')"
          :alt="$t('status.favicon')"
          :src="user.favicon"
        >
      </span>
    </template>

    <span class="misc" :class="{ '-has-actions': true }">
      <span
        v-if="!nonMention && status?.pinned"
        class="pin"
      >
        <FAIcon
          icon="thumbtack"
          class="faint"
        />
        <span class="faint">{{ $t('status.pinned') }}</span>
      </span>
      <router-link
        v-if="status"
        class="timeago faint"
        :to="{ name: 'conversation', params: { statusId: status.id } }"
        :aria-label="$t('status.open_in_thread_view')"
      >
        <Timeago
          :time="time"
          :auto-update="60"
        />
      </router-link>
      <span
        v-else
        class="timeago faint"
      >
        <Timeago
          :time="time"
          :auto-update="60"
        />
      </span>
      <span
        v-if="!nonMention && status.visibility"
        class="visibility-icon"
        :title="visibilityLocalized"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110"
          :icon="visibilityIcon"
        />
      </span>
      <button
        v-if="!nonMention && expandable && !expanded"
        class="button-unstyled"
        :title="$t('status.expand')"
        @click.prevent="$emit('toggleExpanded')"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110"
          icon="plus-square"
        />
      </button>
      <button
        v-if="unmuted"
        class="button-unstyled"
        @click.prevent="toggleMute"
      >
        <FAIcon
          fixed-width
          icon="eye-slash"
          class="fa-scale-110"
        />
      </button>
      <button
        v-if="status && inThreadForest && replies?.size && !simpleTree"
        class="button-unstyled"
        :title="threadShowing ? $t('status.thread_hide') : $t('status.thread_show')"
        :aria-expanded="threadShowing ? 'true' : 'false'"
        @click.prevent="$emit('toggleThreadDisplay')"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110"
          :icon="threadShowing ? 'chevron-up' : 'chevron-down'"
        />
      </button>
      <button
        v-if="!nonMention && expanded && isTreeView && !simpleTree"
        class="button-unstyled"
        :title="$t('status.show_only_conversation_under_this')"
        @click.prevent="$emit('dive')"
      >
        <FAIcon
          fixed-width
          class="fa-scale-110"
          :icon="'angle-double-right'"
        />
      </button>
      <button
        v-if="nonMention && status"
        class="button-unstyled expand-icon"
        :title="$t('tool_tip.toggle_expand')"
        :aria-expanded="expanded"
        @click.prevent="$emit('toggleExpanded')"
      >
        <FAIcon
          class="fa-scale-110"
          fixed-width
          :icon="expanded ? 'compress-alt' : 'expand-alt'"
        />
      </button>
    </span>
  </div>
</template>
<script src="./status_header.js"></script>
<style src="./status_header.scss"></style>
