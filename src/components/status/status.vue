<template>
  <article
    v-if="!hideStatus"
    ref="root"
    class="Status"
    :class="rootClasses"
    :aria-label="mainStatus.summary || $t('status.unsubjected')"
  >
    <div
      v-if="error"
      class="alert error"
    >
      {{ error }}
      <button
        class="fa-scale-110 fa-old-padding"
        type="button"
        @click="clearError"
      >
        <FAIcon icon="times" />
      </button>
    </div>
    <template v-if="muted && !isPreview">
      <div class="muted">
        <small class="status-username">
          <FAIcon
            v-if="muted && isRepeat"
            class="fa-scale-110 fa-old-padding repeat-icon"
            icon="retweet"
          />
          <UserLink
            :user="repeater"
            :at="false"
          />
        </small>
        <small class="mute-reason">
          {{ muteLocalized }}
        </small>
        <button
          class="unmute button-unstyled"
          @click.prevent="toggleMute"
          :title="$t('status.show_muted_status')"
        >
          <FAIcon
            icon="eye-slash"
            class="fa-scale-110 fa-old-padding"
          />
        </button>
      </div>
    </template>
    <template v-else>
      <div
        v-if="isRepeat && !inConversation"
        :class="[repeaterClass, { highlighted: repeaterStyle }]"
        :style="[repeaterStyle]"
        class="repeat-info"
      >
        <UserAvatar
          class="repeater-avatar"
          :user-id="repeater.id"
        />
        <bdi
          class="status-username repeater-name"
          :title="repeaterName"
        >
          <router-link
            v-if="repeaterHtml"
            :to="repeaterProfileLink"
          >
            <RichContent
              :html="repeaterHtml"
              :emoji="repeater.emoji"
              :allow-non-square-emoji="allowNonSquareEmoji"
              :pause-mfm="pauseMfm"
              :scale-mfm="scaleMfm"
              :is-local="repeater.is_local"
            />
          </router-link>
          <router-link
            v-else
            :to="repeaterProfileLink"
          >{{ repeaterName }}</router-link>
        </bdi>
        {{ ' ' }}
        <span class="repeat-label faint">
          <FAIcon
            icon="retweet"
            class="repeat-icon"
            :title="$t('tool_tip.repeat')"
          />
          {{ $t('timeline.repeated') }}
        </span>
      </div>

      <div
        v-if="!isDeleted"
        :class="[userClass, { highlighted: userStyle, '-repeat': isRepeat && !inConversation, '-width-efficient': shouldBeWidthEfficient, '-compact': compact }]"
        :style="[ userStyle ]"
        class="activity-layout"
        :data-tags="tags"
      >
        <UserPopover
          v-if="user.name"
          class="activity-avatar"
          :user-id="user.id"
          overlay-centers
          link
        >
          <UserAvatar
            class="post-avatar"
            :compact="compact"
            :user-id="user.id"
          />
        </UserPopover>
        <UserAvatar
          v-else
          :user-id="user.id"
          class="activity-avatar"
          :compact="compact"
          :title="$t('status.unknown_user_info')"
        />
        <ActivityHeader
          class="activity-header"
          :status-id="mainStatus.id"
          :user-id="user.id"
          :unmuted="unmuted"
          :time="mainStatus.created_at"
          :replies="replies"
          :multiline="shouldBeWidthEfficient"
          :compact="compact"

          :expandable="expandable"
          :expanded="isExpanded"
          :thread-display-state="threadDisplayState"

          @toggle-muted="toggleMute"
          @toggle-expanded="$emit('toggleExpanded')"
          @toggle-thread-display="$emit('toggleThreadDisplay')"
          @dive="$emit('dive')"
        />
        <div class="activity-subheader">
          <div
            v-if="scrobblePresent"
            class="status-rich-presence"
          >
            <a
              v-if="scrobble.externalLink"
              :href="scrobble.externalLink"
              target="_blank"
            >
              {{ scrobble.artist }} — {{ scrobble.title }}
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="play"
              />
              <span class="status-rich-presence-time">
                <Timeago
                  template-key="time.in_past"
                  :time="scrobble.created_at"
                  :auto-update="60"
                />
              </span>
            </a>
            <span v-if="!scrobble.externalLink">
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="music"
              />
              {{ scrobble.artist }} — {{ scrobble.title }}
              <FAIcon
                class="fa-scale-110 fa-old-padding"
                icon="play"
              />
              <span class="status-rich-presence-time">
                <Timeago
                  template-key="time.in_past"
                  :time="scrobble.created_at"
                  :auto-update="60"
                />
              </span>
            </span>
          </div>
          <div
            v-if="isReply || hasMentionsLine"
            class="heading-reply-row"
          >
            <span
              v-if="isReply"
              class="glued-label reply-glued-label"
            >
              <i18n-t
                keypath="status.reply_to_with_arg"
                scope="global"
              >
                <template #replyToWithIcon>
                  <StatusPopover
                    v-if="!isPreview"
                    :status-id="mainStatus.parent_visible && mainStatus.in_reply_to_status_id"
                    class="reply-to-popover"
                    style="min-width: 0;"
                    :class="{ '-strikethrough': !mainStatus.parent_visible }"
                    :aria-label="$t('tool_tip.reply')"
                    :link="isExpanded"
                  >
                      <i18n-t
                        keypath="status.reply_to_with_icon"
                        scope="global"
                      >
                      <template #icon>
                        <FAIcon
                          class="fa-scale-110"
                          icon="reply"
                          flip="horizontal"
                        />
                      </template>
                      <template #replyTo>
                        <span
                          class="reply-to-text"
                        >
                          {{ $t('status.reply_to') }}
                        </span>
                      </template>
                    </i18n-t>
                  </StatusPopover>

                  <span
                    v-else
                    class="reply-to-no-popover"
                  >
                    <span class="reply-to-text">{{ $t('status.reply_to') }}</span>
                  </span>
                </template>
                <template #user>
                  <MentionLink
                    :content="replyToName"
                    :url="replyProfileLink"
                    :user-id="status.in_reply_to_user_id"
                    :user-screen-name="status.in_reply_to_screen_name"
                  />
                </template>
              </i18n-t>
            </span>

            <!-- This little wrapper is made for sole purpose of "gluing" -->
            <!-- "Mentions" label to the first mention -->
            <span
              v-if="hasMentionsLine"
              class="glued-label"
            >
              <span
                class="mentions"
                :aria-label="$t('tool_tip.mentions')"
                @click.prevent="gotoOriginal(status.in_reply_to_status_id)"
              >
                <span
                  class="mentions-text"
                >
                  {{ $t('status.mentions') }}
                </span>
              </span>
              <MentionsLine
                v-if="hasMentionsLine"
                :mentions="mentionsLine.slice(0, 1)"
                class="mentions-line-first"
              />
            </span>
            {{ ' ' }}
            <MentionsLine
              v-if="hasMentionsLine"
              :mentions="mentionsLine.slice(1)"
              class="mentions-line"
            />
          </div>
          <div
            v-if="isEdited && editingAvailable && !isPreview"
            class="heading-edited-row"
          >
            <i18n-t
              scope="global"
              keypath="status.edited_at"
              tag="span"
            >
              <template #time>
                <Timeago
                  template-key="time.in_past"
                  :time="mainStatus.edited_at"
                  :auto-update="60"
                  :long-format="true"
                />
              </template>
            </i18n-t>
          </div>
        </div>
        <div
          class="activity-content"
        >
          <StatusContent
            ref="content"
            :status="mainStatus"
            :focused="focused"
            :in-conversation="inConversation"
            @mediaplay="addMediaPlaying($event)"
            @mediapause="removeMediaPlaying($event)"
            @parse-ready="setHeadTailLinks"
          />

          <Quote
            :status-id="quoteId"
            :status-url="quoteUrl"
            :status-visible="quoteVisible"
            :initially-expanded="quoteExpanded"
          />

          <div
            v-if="inConversation && !isPreview && replies?.size"
            class="replies"
          >
            <button
              v-if="showOtherRepliesInside && replies.size > 1"
              class="button-unstyled -link"
              :title="$t('status.ancestor_follow', { numReplies: replies.size - 1 }, replies.size - 1)"
              @click.prevent="$emit('dive')"
            >
              {{ $t('status.replies_list_with_others', { numReplies: replies.size - 1 }, replies.size - 1) }}
            </button>
            <span
              v-else
              role="header"
              :aria-level="headerLevel"
              class="faint"
            >
              {{ $t('status.replies_list') }}
            </span>
            <span role="list" :aria-label="$t('status.replies_list')">
              <span
                v-for="reply in replies.values()"
                :key="reply.id"
                role="listitem"
                :aria-label="reply.name"
              >
                <StatusPopover
                  :status-id="reply.id"
                  class="reply-link"
                  link
                >
                  {{ reply.name }}
                </StatusPopover>
                {{ ' ' }}
              </span>
            </span>
          </div>

          <Transition name="fade">
            <div
              v-if="shouldDisplayFavsAndRepeats"
              class="favs-repeated-users"
            >
              <div class="stats">
                <UserListPopover
                  v-if="repeatedBy.size > 0"
                  :user-ids="repeatedBy"
                >
                  <div class="stat-count">
                    <a class="stat-title">{{ $t('status.repeats') }}</a>
                    <div class="stat-number">
                      {{ repeatedBy.size }}
                    </div>
                  </div>
                </UserListPopover>
                <UserListPopover
                  v-if="favoritedBy.size > 0"
                  :user-ids="favoritedBy"
                >
                  <div
                    class="stat-count"
                  >
                    <a class="stat-title">{{ $t('status.favorites') }}</a>
                    <div class="stat-number">
                      {{ favoritedBy.size }}
                    </div>
                  </div>
                </UserListPopover>
                <router-link
                  v-if="mainStatus.quotes_count > 0"
                  :to="{ name: 'quotes', params: { id: status.id } }"
                >
                  <div
                    class="stat-count"
                  >
                    <a class="stat-title">{{ $t('status.quotes') }}</a>
                    <div class="stat-number">
                      {{ mainStatus.quotes_count }}
                    </div>
                  </div>
                </router-link>
                <div class="avatar-row">
                  <AvatarList :user-ids="combinedFavsAndRepeatsUsers" />
                </div>
              </div>
            </div>
          </Transition>

          <EmojiReactions
            v-if="(mergedConfig.emojiReactionsOnTimeline || focused) && (!isPreview)"
            :status="mainStatus"
          />
        </div>

        <StatusActionButtons
          v-if="!isPreview"
          class="activity-actions"
          :status="mainStatus"
          :replying="replying"
          @toggle-replying="toggleReplyForm"
        />
      </div>
      <div
        v-else
        class="gravestone"
      >
        <UserAvatar
          class="post-avatar"
          :compact="compact"
        />
        <div class="deleted-text">
          {{ $t('status.status_deleted') }}
        </div>
      </div>
      <div
        v-if="replying"
        class="reply-form"
      >
        <PostStatusForm
          ref="postStatusForm"
          class="reply-body"
          :closeable="true"
          :replied-status="mainStatus"
          @posted="closeReplyForm"
          @draft-done="closeReplyForm"
          @close-accepted="closeReplyForm"
        />
      </div>
      <i18n-t
        v-if="inConversation && conversationRank === 'ancestor' && !isPreview && showOtherRepliesBelow && replies?.size > 1"
        tag="button"
        scope="global"
        keypath="status.ancestor_follow_with_icon"
        class="button-unstyled -link thread-tree-show-replies-button"
        @click.prevent="$emit('dive')"
      >
        <template #icon>
          <FAIcon
            icon="angle-double-right"
          />
        </template>
        <template #text>
          <span>
            {{ $t('status.ancestor_follow', { numReplies: replies.size - 1 }) }}
          </span>
        </template>
      </i18n-t>
    </template>
  </article>
</template>

<script src="./status.js"></script>

<style src="./status.scss" lang="scss"></style>
<style src="./activity-layout.scss" lang="scss"></style>
