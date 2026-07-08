<template>
  <div class="ChatMessageList">
    <ChatMessage
      v-for="chatItem in chatItems"
      :key="chatItem.id"
      :chat-item="chatItem"
      :hovered-message-chain="chatItem.messageChainId === hoveredMessageChainId"
      @hover="onMessageHover"
      @delete="onMessageDelete"
    />
  </div>
</template>

<script src="./chat_message_list.js"></script>
<style src="./chat_message_list.scss" lang="scss" />
