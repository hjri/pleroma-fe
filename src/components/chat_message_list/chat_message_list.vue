<template>
  <div class="ChatMessageList">
    <ChatMessage
      v-for="(chatItem, index) in chatItems"
      :key="chatItem.id"
      :chat-item="chatItem"
      :previous-item="getPreviousItem(index)"
      :hovered-message-chain="chatItem.messageChainId === hoveredMessageChainId"
      @hover="onMessageHover"
      @delete="onMessageDelete"
      @reply-requested="onReplyRequested"
    />
  </div>
</template>

<script src="./chat_message_list.js"></script>
<style src="./chat_message_list.scss" lang="scss" />
