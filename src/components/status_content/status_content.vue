<template>
  <div
    class="StatusContent"
    :class="{ '-compact': compact }"
  >
    <slot name="header" />
    <StatusBody
      :status="status"
      :compact="compact"
      :single-line="singleLine"
      :collapse="collapse"
      @parse-ready="$emit('parseReady', $event)"
    >
      <div v-if="status.poll && status.poll.options && !compact">
        <Poll
          :base-poll="status.poll"
          :emoji="status.emojis"
        />
      </div>

      <div
        v-else-if="status.poll && status.poll.options && compact"
        class="poll-icon"
      >
        <FAIcon
          icon="poll-h"
          size="2x"
        />
      </div>

      <Gallery
        v-if="status.attachments.length !== 0"
        class="attachments media-body"
        :compact="compact"
        :nsfw="nsfwClickthrough"
        :attachments="status.attachments"
        :limit="compact ? 1 : 0"
        :size="attachmentSize"
        @play="$emit('mediaplay')"
        @pause="$emit('mediapause')"
      />

      <div
        v-if="statusCard && !compact"
        class="link-preview media-body"
      >
        <link-preview
          :card="status.card"
          :size="attachmentSize"
          :nsfw="nsfwClickthrough"
        />
      </div>
    </StatusBody>
    <slot name="footer" />
  </div>
</template>

<script src="./status_content.js"></script>
<style lang="scss">
.StatusContent {
  flex: 1;
  min-width: 0;

  .poll-icon {
    margin: 0.5em;
  }
}
</style>
