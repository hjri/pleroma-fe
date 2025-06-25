<template>
  <div
    ref="root"
    class="input emoji-input"
    :class="{ 'with-picker': !hideEmojiButton }"
  >
    <slot
      :id="'textbox-' + randomSeed"
      :aria-owns="suggestionListId"
      aria-autocomplete="both"
      :aria-expanded="showSuggestions"
      :aria-activedescendant="(!showSuggestions || highlighted === -1) ? '' : suggestionItemId(highlighted)"
    />
    <!-- TODO: make the 'x' disappear if at the end maybe? -->
    <div
      ref="hiddenOverlay"
      class="hidden-overlay"
      :style="overlayStyle"
      :aria-hidden="true"
    >
      <span>{{ preText }}</span>
      <span
        ref="hiddenOverlayCaret"
        class="caret"
      >x</span>
      <span>{{ postText }}</span>
    </div>
    <screen-reader-notice
      ref="screenReaderNotice"
      aria-live="assertive"
    />
    <template v-if="enableEmojiPicker">
      <button
        v-if="!hideEmojiButton"
        class="button-unstyled emoji-picker-icon"
        type="button"
        :title="$t('emoji.add_emoji')"
        @click.prevent="togglePicker"
      >
        <FAIcon :icon="['far', 'smile-beam']" />
      </button>
      <EmojiPicker
        v-if="enableEmojiPicker"
        ref="picker"
        :enable-sticker-picker="enableStickerPicker"
        class="emoji-picker-panel"
        @emoji="insert"
        @sticker-uploaded="onStickerUploaded"
        @sticker-upload-failed="onStickerUploadFailed"
        @show="onPickerShown"
        @close="onPickerClosed"
      />
    </template>
    <Popover
      ref="suggestorPopover"
      class="autocomplete-panel"
      placement="bottom"
      :hide-trigger="true"
    >
      <template #content>
        <div
          :id="suggestionListId"
          ref="panel-body"
          class="autocomplete-panel-body"
          role="listbox"
        >
          <div
            v-for="(suggestion, index) in suggestions"
            :id="suggestionItemId(index)"
            :key="index"
            class="menu-item autocomplete-item"
            role="option"
            :class="{ '-active': index === highlighted }"
            :aria-label="autoCompleteItemLabel(suggestion)"
            :aria-selected="index === highlighted"
            @click.stop.prevent="onClick($event, suggestion)"
          >
            <span class="image">
              <img
                v-if="suggestion.img"
                :src="suggestion.img"
              >
              <span v-else>{{ suggestion.replacement }}</span>
            </span>
            <div class="label">
              <span
                v-if="suggestion.user"
                class="displayText"
              >
                {{ suggestion.displayText }}<UnicodeDomainIndicator
                  :user="suggestion.user"
                  :at="false"
                />
              </span>
              <span
                v-if="!suggestion.user"
                class="displayText"
              >
                {{ maybeLocalizedEmojiName(suggestion) }}
              </span>
              <span class="detailText">{{ suggestion.detailText }}</span>
            </div>
          </div>
        </div>
      </template>
    </Popover>
  </div>
</template>

<script src="./emoji_input.js"></script>

<style lang="scss">
.input.emoji-input {
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;

  .emoji-picker-icon {
    position: absolute;
    top: 0;
    right: 0;
    margin: 0.2em 0.25em;
    font-size: 1.3em;
    cursor: pointer;
    line-height: 24px;

    &:hover i {
      color: var(--text);
    }
  }

  .emoji-picker-panel {
    position: absolute;
    z-index: 20;
    margin-top: 2px;

    &.hide {
      display: none;
    }
  }

  input,
  textarea {
    flex: 1 0 auto;
    color: inherit;
    /* stylelint-disable-next-line declaration-no-important */
    background: none !important;
    box-shadow: none;
    border: none;
    outline: none;
  }

  &.with-picker input {
    padding-right: 30px;
  }

  .hidden-overlay {
    opacity: 0;
    pointer-events: none;
    position: absolute;
    inset: 0;
    overflow: hidden;

    /* DEBUG STUFF */
    color: red;

    /* set opacity to non-zero to see the overlay */

    .caret {
      width: 0;
      margin-right: calc(-1ch - 1px);
      border: 1px solid red;
    }
  }
}

.autocomplete {
  &-panel {
    position: absolute;
  }

  &-item.menu-item {
    display: flex;
    padding-top: 0;
    padding-bottom: 0;

    .image {
      width: calc(var(--__line-height) + var(--__vertical-gap) * 2);
      height: calc(var(--__line-height) + var(--__vertical-gap) * 2);
      line-height: var(--__line-height);
      text-align: center;
      margin-right: var(--__horizontal-gap);

      img {
        width: calc(var(--__line-height) + var(--__vertical-gap) * 2);
        height: calc(var(--__line-height) + var(--__vertical-gap) * 2);
        object-fit: contain;
      }

      span {
        font-size: var(--__line-height);
        line-height: var(--__line-height);
      }
    }

    .label {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0 0.1em 0 0.2em;

      .displayText {
        line-height: 1.5;
      }

      .detailText {
        font-size: 9px;
        line-height: 9px;
      }
    }
  }
}
</style>
