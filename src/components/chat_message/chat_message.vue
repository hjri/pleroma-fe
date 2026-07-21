<template>
  <div
    v-if="isMessage"
    class="chat-message-wrapper"
    :class="{ 'hovered-message-chain': hoveredMessageChain }"
    @mouseover="onHover(true)"
    @mouseleave="onHover(false)"
  >
    <div
      class="chat-message"
      :class="[{ '-outgoing': isCurrentUser, '-incoming': !isCurrentUser, '-pending': message.pending }]"
    >
      <div
        v-if="!isCurrentUser"
        class="avatar-wrapper"
      >
        <UserPopover
          v-if="chatItem.isHead"
          :user-id="author.id"
        >
          <UserAvatar
            :compact="true"
            :user="author"
          />
        </UserPopover>
      </div>
      <div class="chat-message-inner">
        <small
          v-if="isStatus && isCustomReply"
          class="reply-to-header faint"
        >
          <strong class="reply-label">
            <FAIcon
              class="fa-scale-110 fa-old-padding"
              icon="reply"
              flip="horizontal"
            />
            {{ $t('status.reply_to') }}
          </strong>
          <!-- v-if is there because status might not be loaded yet -->
          <StatusBody
            v-if="customReplyTo"
            class="reply-body"
            :status="customReplyTo"
            collapse
            single-line
          />
        </small>
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
              @toggle-replying="$emit('replyRequested', message)"
            />
            <div
              class="chat-message-toolbar"
              :class="{ '-visible': hovered || menuOpened }"
              v-else
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
                <span
                  class="created-at"
                >
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
                  {{ createdAt }}
                </span>
              </template>
            </StatusContent>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-else
    class="chat-message-date-separator"
  >
    <ChatMessageDate :date="chatItem.date" :show-time="chatItem.isTime" />
  </div>
</template>

<script src="./chat_message.js"></script>

<style src="./chat_message.scss" lang="scss" />
