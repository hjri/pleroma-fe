<template>
  <div
    v-if="isMessage"
    :id="`chatmessage-${message.id}`"
    class="chat-message-wrapper"
    :class="[classnames, { 'hovered-message-chain': hoveredMessageChain }]"
    @mouseover="onHover(true)"
    @mouseleave="onHover(false)"
  >
    <i18n-t
      v-if="isStatus && (isCustomReply || isBrokenReply)"
      keypath="status.reply_to_with_arg"
      scope="global"
      tag="small"
      class="reply-to-header faint"
    >
      <template #replyToWithIcon>
        <div class="avatar-spacer" />
        <StatusPopover
          v-if="!isBrokenReply"
          :status-id="customReplyTo?.id"
          class="reply-to-popover"
          :class="{ '-strikethrough': !message.parent_visible }"
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
              <span class="reply-label">
                {{ $t('status.reply_to') }}
              </span>
            </template>
          </i18n-t>
        </StatusPopover>
        <span
          v-else
          class="reply-label"
        >
          {{ $t('status.broken_reply') }}
        </span>
      </template>
      <template #user>
        <MentionLink
          class="reply-body"
          :content="replyToName"
          :url="replyProfileLink"
          :user-id="message.in_reply_to_user_id"
          :user-screen-name="message.in_reply_to_screen_name"
        />
        <!-- v-if is there because status might not be loaded yet -->
        <template v-if="customReplyTo?.text.trim().length > 0">
          :
          <StatusBody
            class="reply-body faint"
            :status="customReplyTo"
            collapse
            single-line
            ignore-subject
          />
        </template>
      </template>
    </i18n-t>
    <div
      class="chat-message"
      :class="classnames"
    >
      <div
        v-if="!isCurrentUser"
        class="avatar-wrapper"
      >
        <UserPopover
          v-if="chatItem.isHead"
          :user-id="authorId"
        >
          <UserAvatar
            v-if="author"
            :compact="true"
            :user="author"
          />
        </UserPopover>
        <div
          v-else
          class="avatar-spacer"
        />
      </div>
      <div class="chat-message-inner">
        <div class="message-bubble-wrapper">
          <div
            class="status-body"
            :style="{ 'min-width': message.attachment ? '80%' : '' }"
          >
            <div
              class="media status"
              :class="{ 'without-attachment': !hasAttachment, 'pending': chatItem.data.pending, 'error': chatItem.data.error }"
              style="position: relative;"
              @mouseenter="hovered = true"
              @mouseleave="hovered = false"
            >
              <StatusActionButtons
                v-if="isStatus"
                class="chat-message-toolbar"
                :class="{ '-visible': hovered || menuOpened }"
                :status="message"
                :pinned="new Set(['reply', 'emoji'])"
                fixed-pinned
                use-default-buttons
                hide-labels
                in-chat-view
                @toggle-replying="$emit('replyRequested', message)"
              />
              <div
                v-else
                class="chat-message-toolbar"
                :class="{ '-visible': hovered || menuOpened }"
              >
                <Popover
                  trigger="click"
                  :trigger-attrs="{ 'class': 'button-default menu-icon simple-button', title: $t('chats.more') }"
                  placement="top"
                  :margin="popoverMarginStyle"
                  @show="menuOpened = true"
                  @close="menuOpened = false"
                >
                  <template #content>
                    <div class="dropdown-menu">
                      <div class="menu-item dropdown-item -icon">
                        <button
                          class="main-button"
                          @click="deleteMessage"
                        >
                          <FAIcon icon="times" /> {{ $t("chats.delete") }}
                        </button>
                      </div>
                    </div>
                  </template>
                  <template #trigger>
                    <FAIcon icon="ellipsis-h" />
                  </template>
                </Popover>
              </div>
              <StatusContent
                class="message-content"
                :class="{ faint: message.pending }"
                :status="messageForStatusContent"
                :full-content="true"
              >
                <template #footer>
                  <EmojiReactions
                    v-if="isStatus"
                    :status="message"
                  />
                  <Quote
                    v-if="isStatus"
                    class="quoted-post"
                    :status-id="quoteId"
                    :status-url="quoteUrl"
                    :status-visible="quoteVisible"
                    initially-expanded
                  />
                  <span
                    class="created-at"
                  >
                    <span
                      v-if="message.favorited"
                    >
                      <FAIcon
                        class="fa-scale-110"
                        icon="star"
                        fixed-width
                      />
                    </span>
                    <span
                      v-if="message.repeated"
                    >
                      <FAIcon
                        class="fa-scale-110"
                        icon="retweet"
                        fixed-width
                      />
                    </span>
                    <span
                      v-if="message.visibility"
                      class="visibility-icon"
                      :title="visibilityLocalized"
                    >
                      <FAIcon
                        class="fa-scale-110"
                        :icon="visibilityIcon(message.visibility)"
                        fixed-width
                      />
                    </span>
                    <span
                      v-if="message.pending"
                      class="loading-spinner"
                    >
                      <FAIcon
                        class="fa-old-padding"
                        icon="circle-notch"
                        spin
                      />
                    </span>
                    {{ ' ' }}
                    <router-link
                      class="timeago faint"
                      :to="{ name: 'conversation2', params: { statusId: message.id } }"
                    >
                      <Timeago
                        :time="message.created_at"
                        :auto-update="60"
                      />
                    </router-link>
                  </span>
                </template>
              </StatusContent>
            </div>
          </div>
          <div
            v-if="isStatus && repliedTo"
            class="reply-indicator"
          >
            <FAIcon
              class="icon"
              icon="reply"
            />
          </div>
          <div class="end-spacer" />
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="chat-message-date-separator"
  >
    <ChatMessageDate
      :date="chatItem.date"
      :show-time="chatItem.isTime"
    />
  </div>
</template>

<script src="./chat_message.js"></script>

<style src="./chat_message.scss" lang="scss" />
