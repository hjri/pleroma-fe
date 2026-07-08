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
            <div
              class="chat-message-menu"
              :class="{ 'visible': hovered || menuOpened }"
            >
              <Popover
                trigger="click"
                placement="top"
                bound-to-selector=".chat-view-inner"
                :bound-to="{ x: 'container' }"
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
                  <button
                    class="button-default menu-icon"
                    :title="$t('chats.more')"
                  >
                    <FAIcon icon="ellipsis-h" />
                  </button>
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
                      fixed-width
                      class="fa-scale-110"
                      :icon="visibilityIcon(message.visibility)"
                    />
                  </span>
                  <span
                    v-if="message.pending"
                    class="loading-spinner"
                  >
                    <FAIcon
                      class="fa-old-padding"
                      spin
                      icon="circle-notch"
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
