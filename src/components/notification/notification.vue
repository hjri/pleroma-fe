<template>
  <Status
    v-if="notification.type === 'mention' || notification.type === 'status'"
    ref="root"
    class="Notification panel-body"
    :compact="true"
    :status-id="notification.status?.id"
    @click="interacted"
    width-efficient
  />
  <article
    v-else
    ref="root"
    class="NotificationParent panel-body"
    :class="{ '-expandable': expandable }"
  >
    <div
      v-if="needMute && !unmuted"
      :id="'notif-' +notification.id"
      :aria-expanded="statusExpanded"
      :aria-controls="'notif-' +notification.id"
      class="Notification container -muted"
    >
      <small>
        <UserLink
          :user="notification.from_profile"
          :at="false"
        />
      </small>
      <button
        class="button-unstyled unmute"
        @click.prevent="toggleMute"
      >
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="eye-slash"
        />
      </button>
    </div>
    <div
      v-else
      class="Notification -non-mention activity-layout -width-efficient -compact"
      :class="[userClass, { highlighted: userStyle }, '-type--' + notification.type]"
      :style="[ userStyle ]"
    >
      <div class="activity-avatar">
        <a
          :href="$router.resolve(userProfileLink).href"
          @click.prevent
        >
          <UserPopover
            :user-id="notification.from_profile.id"
            :overlay-centers="true"
          >
            <UserAvatar
              class="post-avatar"
              :compact="true"
              :user-id="notification.from_profile.id"
            />
          </UserPopover>
        </a>
      </div>
      <ActivityHeader
        class="activity-header"
        :statusoid="status"
        :time="notification.created_at"
        :user-id="notification.from_profile.id"
        @toggle-expanded="toggleStatusExpanded"
        :expanded="statusExpanded"
        non-mention
        multiline
      />
      <div class="activity-subheader">
        <span v-if="notification.type === 'like'">
          <FAIcon
            class="type-icon"
            icon="star"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.favorited_you') }}</small>
        </span>
        <span v-if="notification.type === 'repeat'">
          <FAIcon
            class="type-icon"
            icon="retweet"
            :title="$t('tool_tip.repeat')"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.repeated_you') }}</small>
        </span>
        <span v-if="notification.type === 'follow'">
          <FAIcon
            class="type-icon"
            icon="user-plus"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.followed_you') }}</small>
        </span>
        <span v-if="notification.type === 'follow_request'">
          <FAIcon
            class="type-icon"
            icon="user"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.follow_request') }}</small>
        </span>
        <span v-if="notification.type === 'move'">
          <FAIcon
            class="type-icon"
            icon="suitcase-rolling"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.migrated_to') }}</small>
        </span>
        <span v-if="notification.type === 'pleroma:emoji_reaction'">
          <small>
            <i18n-t
              scope="global"
              keypath="notifications.reacted_with"
            >
              <img
                v-if="notification.emoji_url"
                class="emoji-reaction-emoji emoji-reaction-emoji-image"
                :src="notification.emoji_url"
                :alt="notification.emoji"
                :title="notification.emoji"
                :class="{ ['-wide']: allowNonSquareEmoji }"
              >
              <span
                v-else
                class="emoji-reaction-emoji"
              >{{ notification.emoji }}</span>
            </i18n-t>
          </small>
        </span>
        <span v-if="notification.type === 'pleroma:report'">
          <small>{{ $t('notifications.submitted_report') }}</small>
        </span>
        <span v-if="notification.type === 'poll'">
          <FAIcon
            class="type-icon"
            icon="poll-h"
          />
          {{ ' ' }}
          <small>{{ $t('notifications.poll_ended') }}</small>
        </span>
      </div>
      <div class="activity-content">
        <div
          v-if="notification.type === 'follow' || notification.type === 'follow_request'"
          class="follow-text activity-content"
        >
          <UserLink
            class="follow-name"
            :user="notification.from_profile"
          />
        </div>
        <div
          v-else-if="notification.type === 'move'"
          class="move-text activity-content"
        >
          <UserLink
            :user="notification.target"
          />
        </div>
        <Report
          class="avatar-container"
          v-else-if="notification.type === 'pleroma:report'"
          :report-id="notification.report.id"
        />
        <StatusContent
          v-if="status"
          class="activity-container"
          :compact="!statusExpanded"
          :status="status"
          :collapse="!statusExpanded"
          @click="onContentClick"
        />
      </div>
      <div
        v-if="notification.type === 'follow_request'"
        style="white-space: nowrap;"
        class="activity-actions"
      >
        <button
          class="button-unstyled"
          :title="$t('tool_tip.accept_follow_request')"
          @click="() => approve(user.id)"
        >
          <FAIcon
            icon="check"
            class="fa-scale-110 fa-old-padding follow-request-accept"
          />
        </button>
        <button
          class="button-unstyled"
          :title="$t('tool_tip.reject_follow_request')"
          @click="() => deny(user.id)"
        >
          <FAIcon
            icon="times"
            class="fa-scale-110 fa-old-padding follow-request-reject"
          />
        </button>
      </div>
    </div>
  </article>
</template>

<script src="./notification.js"></script>
<style src="./notification.scss" lang="scss"></style>
<style src="/src/components/status/activity-layout.scss" lang="scss"></style>
