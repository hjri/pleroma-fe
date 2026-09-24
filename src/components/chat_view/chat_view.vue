<template>
<div
  class="chat-view"
  ref="root"
>
    <div class="chat-view-inner">
      <div
        ref="inner"
        class="panel-default panel chat-view-body"
      >
        <div
          ref="header"
          class="panel-heading -sticky chat-view-heading"
        >
          <div class="title">
            <template v-if="isConversation">
              <RichContent
                v-if="messages[0]?.summary_raw_html"
                :html="messages[0].summary_raw_html"
                :emoji="messages[0].emojis"
              />
              <template v-else>
                {{ $t('timeline.conversation') }}
              </template>
            </template>
            <ChatTitle
              v-else
              :user="chatRecipient"
              :with-avatar="true"
            />
          </div>
        </div>
        <div class="chat-list-wrapper panel-body">
          <ChatMessageList
            ref="messageList"
            header-date
            :messages="messages"
            :replied-id="replyTo?.id"
            :focused-id="focusedId"
            @reply-requested="e => explicitReply = e"
          />
          <ChatMessageList
            pending
            ref="pendingMessageList"
            :messages="pendingMessages"
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
                v-if="newMessagesCount"
                class="badge -notification unread-chat-count unread-message-count"
              >
                {{ newMessagesCount }}
              </div>
            </span>
          </div>
          <div
            v-if="isConversation"
            class="auto-reply-to-section"
          >
            <div class="reply-to-text">
              {{ explicitReply ? $t('status.reply_to_selected') : $t('status.reply_to_last') }}
              <button
                v-if="explicitReply"
                class="button-default"
                @click="explicitReply = null"
              >
                <FAIcon icon="times" />
                {{ $t('general.cancel') }}
              </button>
            </div>
          </div>
          <PostStatusForm
            ref="postStatusForm"
            :replied-status="replyTo"
            :mentions-line="isConversation"
            mentions-line-read-only

            disable-quotes
            disable-notice
            disable-lock-warning
            :disable-subject="isChat"
            :disable-scope-selector="isChat"
            :disable-polls="isChat"
            :disable-sensitivity-checkbox="isChat"
            :disable-preview="isChat"
            :disable-draft="isChat"

            :disable-submit="isConversation ? !replyTo : (!!error || !chatReady)"
            :optimistic-posting="!isConversation"

            chat-view
            preserve-focus
            :auto-focus="!mobileLayout"
            :placeholder="formPlaceholder"
            :file-limit="isConversation ? null : 1"
            :max-height="160"
            emoji-picker-placement="top"
            :post-handler="isConversation ? null : sendMessage"
            @posted="onPosted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./chat_view.js"></script>
<style src="./chat_view.scss" lang="scss" />
