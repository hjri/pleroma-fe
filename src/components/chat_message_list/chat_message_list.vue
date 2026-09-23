<template>
  <div class="ChatMessageList" ref="body">
    <template
      v-for="element in heightChart"
      :key="element.id"
    >
      <ChatMessage
        v-if="element.type === 'item'"
        :chat-item="getCurrentItem(element.id)"
        :hovered-message-chain="getCurrentItem(element.id).messageChainId === hoveredMessageChainId"
        :focused="element.id === focusedId"
        :replied-to="element.id === repliedId"
        @hover="onMessageHover"
        @reply-requested="onReplyRequested"
        @height-change="updateVirtualHeight"
      />
      <div
        v-if="element.type === 'spacer'"
        class="virtual-spacer"
        aria-hidden="true"
        :style="{ height: element.height + 'px' }"
      />
    </template>
  </div>
</template>

<script src="./chat_message_list.js"></script>
<style src="./chat_message_list.scss" lang="scss" />
