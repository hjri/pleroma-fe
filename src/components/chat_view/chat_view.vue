<template>
  <div class="chat-view">
    <div class="chat-view-inner">
      <div
        ref="inner"
        class="panel-default panel chat-view-body"
      >
        <div
          ref="header"
          class="panel-heading -sticky chat-view-heading"
        >
          <button
            class="button-unstyled go-back-button"
            @click="goBack"
          >
            <FAIcon
              size="lg"
              icon="chevron-left"
            />
          </button>
          <div class="title">
            <template v-if="isConversation">
              <RichContent
                v-if="messages[0]?.summary"
                :html="messages[0].summary"
                />
              <template v-else>
                {{ $t('timeline.conversation') }}
              </template>
            </template>
            <ChatTitle
              v-else
              :user="recipient"
              :with-avatar="true"
            />
          </div>
        </div>
        <div class="chat-list-wrapper panel-body">
          <div class="top-spacer" />
          <ChatMessageList
            ref="messageList"
            header-date
            :messages="messages"
            :pending-messages="pendingMessages"
            :replied-id="replyStatus?.id"
            :focused-id="statusId"
            @message-delete="deleteChatMessage"
            @reply-requested="e => explicitReplyStatus = e"
          />
        </div>
        <div
          ref="footer"
          class="panel-footer -flexible-height footer"
        >
          <div
            class="jump-to-bottom-button"
            :class="{ 'visible': jumpToBottomButtonVisible }"
            @click="scrollDown({ behavior: 'smooth' })"
          >
            <span>
              <FAIcon icon="chevron-down" />
              <div
                v-if="newMessageCount"
                class="badge -notification unread-chat-count unread-message-count"
              >
                {{ newMessageCount }}
              </div>
            </span>
          </div>
          <div
            v-if="isConversation"
            class="auto-reply-to-section"
          >
            <div class="reply-to-text">
              {{ explicitReplyStatus ? $t('status.reply_to_selected') : $t('status.reply_to_last') }}
              <button
                v-if="explicitReplyStatus"
                class="button-default"
                @click="explicitReplyStatus = null"
              >
                <FAIcon icon="times" />
                {{ $t('general.cancel') }}
              </button>
            </div>
          </div>
          <PostStatusForm
            ref="postStatusForm"
            :reply-to="replyStatus?.id"
            :mentions-line="isConversation"
            mentions-line-read-only
            :attentions="replyStatus?.attentions"
            :replied-user="replyStatus?.user"
            :replied-subject="replyStatus?.summary"
            :replied-scope="replyStatus?.visibility"

            disable-quotes
            disable-notice
            disable-lock-warning
            :disable-subject="!isConversation"
            :disable-scope-selector="!isConversation"
            :disable-polls="!isConversation"
            :disable-sensitivity-checkbox="!isConversation"
            :disable-preview="!isConversation"
            :disable-draft="!isConversation"

            :disable-submit="isConversation ? !!replyStatus : (errorLoadingChat || !chat)"
            :optimistic-posting="!isConversation"

            chat-view
            preserve-focus
            :auto-focus="!mobileLayout"
            :placeholder="formPlaceholder"
            :file-limit="isConversation ? null : 1"
            :max-height="160"
            emoji-picker-placement="top"
            :post-handler="isConversation ? null : sendMessage"
            @resize="handleResize"
            @posted="onPosted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./chat_view.js"></script>
<style src="./chat_view.scss" lang="scss" />
