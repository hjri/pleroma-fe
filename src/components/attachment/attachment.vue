<template>
  <button
    v-if="usePlaceholder"
    class="Attachment -placeholder button-default"
    :class="classNames"
    @click="openModal"
  >
    <a
      v-if="attachment.type !== 'html'"
      class="placeholder"
      target="_blank"
      :href="attachment.url"
      :alt="attachment.description"
      :title="attachment.description"
      @click.prevent
    >
      <FAIcon :icon="placeholderIconClass" />
      <b>{{ nsfw ? "NSFW / " : "" }}</b>{{ edit ? '' : placeholderName }}
    </a>
    <div
      v-if="edit || remove"
      class="attachment-buttons"
      role="toolbar"
      :aria-label="$t('status.attachment_actions')"
    >
      <button
        v-if="remove"
        class="button-default attachment-button -transparent"
        @click.prevent="onRemove"
        :title="$t('status.remove_attachment')"
      >
        <FAIcon icon="trash-alt" />
      </button>
    </div>
    <div
      v-if="size !== 'hide' && !hideDescription && edit"
      class="description-container"
      :class="{ '-static': !edit }"
    >
      <textarea
        v-model="localDescription"
        type="text"
        class="input description-field"
        :placeholder="$t('post_status.media_description')"
        :aria-label="$t('post_status.media_description')"
      />
    </div>
  </button>
  <div
    v-else
    class="Attachment"
    :class="classNames"
  >
    <div
      v-show="!isEmpty"
      class="attachment-wrapper"
      role="presentation"
    >
      <a
        v-if="hidden"
        class="image-container"
        :href="attachment.url"
        :alt="attachment.description"
        :title="attachment.description"
        @click.prevent.stop="toggleHidden"
      >
        <img
          :key="nsfwImage"
          class="nsfw image"
          :src="nsfwImage"
          :alt="$t('status.nsfw_placeholder')"
          :title="$t('status.nsfw_placeholder')"
        >
        <FAIcon
          v-if="attachment.type === 'video'"
          class="play-icon"
          icon="play-circle"
        />
      </a>

      <a
        v-if="attachment.type === 'image' && (!hidden || preloadImage)"
        class="image-container"
        :class="{'-hidden': hidden && preloadImage }"
        :tabindex="hidden ? -1 : 0"
        :aria-hidden="hidden"
        :href="attachment.url"
        target="_blank"
        @click.stop.prevent="openModal"
        aria-haspopup="dialog"
      >
        <StillImage
          class="image"
          :referrerpolicy="referrerpolicy"
          :mimetype="attachment.mimetype"
          :src="attachment.large_thumb_url || attachment.url"
          :image-load-handler="onImageLoad"
          :alt="attachment.description || $t('status.attachment')"
        />
      </a>

      <a
        v-if="attachment.type === 'unknown' && !hidden"
        class="placeholder-container"
        :href="attachment.url"
        target="_blank"
      >
        <FAIcon
          :size="compact ? '2x' : '5x'"
          :icon="placeholderIconClass"
          :title="localDescription || $t('status.attachment')"
        />
        <p v-if="!compact">
          {{ localDescription || $t('status.attachment') }}
        </p>
      </a>

      <component
        :is="videoTag"
        v-if="attachment.type === 'video' && !hidden"
        class="video-container"
        :title="videoTag === 'button' ? $t('status.show_attachment_in_modal') : undefined"
        :href="attachment.url"
        @click.stop.prevent="openModal"
        :aria-haspopup="videoTag === 'button' ? 'dialog' : 'false'"
      >
        <VideoAttachment
          class="video"
          :attachment="attachment"
          :controls="!useModal"
          @play="$emit('play')"
          @pause="$emit('pause')"
        />
        <FAIcon
          v-if="useModal"
          class="play-icon"
          icon="play-circle"
        />
      </component>

      <span
        v-if="attachment.type === 'audio' && !hidden"
        class="audio-container"
        :href="attachment.url"
        @click.stop.prevent="openModal"
      >
        <audio
          v-if="attachment.type === 'audio'"
          :src="attachment.url"
          :alt="attachment.description"
          :title="attachment.description"
          controls
          @play="$emit('play')"
          @pause="$emit('pause')"
        />
      </span>

      <span
        v-if="attachment.type === 'flash' && !hidden"
        class="flash-container"
        :href="attachment.url"
        @click.stop.prevent="openModal"
      >
        <Flash
          ref="flash"
          class="flash"
          :src="attachment.large_thumb_url || attachment.url"
          @player-opened="setFlashLoaded(true)"
          @player-closed="setFlashLoaded(false)"
        />
      </span>

      <div
        v-if="!hidden"
        class="attachment-buttons"
        role="toolbar"
        :aria-label="$t('status.attachment_actions')"
      >
        <button
          v-if="attachment.type === 'flash' && flashLoaded"
          class="button-default attachment-button -transparent"
          :title="$t('status.attachment_stop_flash')"
          @click.prevent="stopFlash"
        >
          <FAIcon icon="stop" />
        </button>
        <Popover
          v-if="attachment.description && size !== 'small' && !edit && attachment.type !== 'unknown'"
          trigger="click"
          popover-class="popover popover-default description-popover"
          normal-button
          class="attachment-button -transparent"
          :title="$t('status.attachment_description')"
        >
          <template #trigger>
            <FAIcon icon="align-right" />
          </template>
          <template #content>
            <details open>
              <summary>{{ $t('status.attachment_description') }}</summary>
              <span>{{ localDescription }}</span>
            </details>
          </template>
        </Popover>
        <button
          v-if="!useModal && attachment.type !== 'unknown'"
          class="button-default attachment-button -transparent"
          :title="$t('status.show_attachment_in_modal')"
          aria-haspopup="dialog"
          @click.prevent="openModalForce"
        >
          <FAIcon icon="search-plus" />
        </button>
        <button
          v-if="nsfw && hideNsfwLocal"
          class="button-default attachment-button -transparent"
          :title="$t('status.hide_attachment')"
          @click.prevent="toggleHidden"
        >
          <FAIcon icon="times" />
        </button>
        <button
          v-if="shiftUp"
          class="button-default attachment-button -transparent"
          :title="$t('status.move_up')"
          @click.prevent="onShiftUp"
        >
          <FAIcon icon="chevron-left" />
        </button>
        <button
          v-if="shiftDn"
          class="button-default attachment-button -transparent"
          :title="$t('status.move_down')"
          @click.prevent="onShiftDn"
        >
          <FAIcon icon="chevron-right" />
        </button>
        <button
          v-if="remove"
          class="button-default attachment-button -transparent"
          :title="$t('status.remove_attachment')"
          @click.prevent="onRemove"
        >
          <FAIcon icon="trash-alt" />
        </button>
      </div>
    </div>
    <div
      v-if="size !== 'hide' && !hideDescription && edit"
      class="description-container"
      :class="{ '-static': !edit }"
    >
      <textarea
        v-model="localDescription"
        type="text"
        class="input description-field"
        :placeholder="$t('post_status.media_description')"
        :aria-label="$t('post_status.media_description')"
      />
    </div>
  </div>
</template>

<script src="./attachment.js"></script>

<style src="./attachment.scss" lang="scss"></style>
