<template>
  <Popover
    ref="popover"
    trigger="click"
    popover-class="emoji-picker popover-default"
    :hide-trigger="hideTrigger"
    placement="bottom"
    :aria-label="$t('emoji.picker')"
    @show="onPopoverShown"
    @close="onPopoverClosed"
    @forward-tab-content-focus="$emit('forwardTabContentFocus')"
    @reverse-tab-content-focus="$emit('reverseTabContentFocus')"
    v-bind="$attrs"
  >
    <template #trigger>
      <slot />
    </template>
    <template #content>
      <div
        class="heading"
        role="presentation"
      >
        <div
          class="emoji-search"
          role="presentation"
        >
          <input
            ref="search"
            role="search"
            v-model="keyword"
            type="text"
            class="input form-control"
            :placeholder="$t('emoji.search_emoji')"
            :title="$t('emoji.search_emoji')"
            @input="$event.target.composing = false"
          >
        </div>
        <!--
          Body scroll lock needs to be on every scrollable element on safari iOS.
          Here we tell it to enable scrolling for this element.
          See https://github.com/willmcpo/body-scroll-lock#vanilla-js
        -->
        <span
          ref="header"
          v-body-scroll-lock="isInModal"
          class="emoji-tabs"
          role="tablist"
          @wheel.prevent="groupScroll"
        >
          <button
            v-for="group in filteredEmojiGroups"
            :ref="setGroupRef('group-header-' + group.id)"
            :key="group.id"
            class="button-unstyled emoji-tabs-item"
            :class="{
              toggled: activeGroupView === group.id
            }"
            :title="group.text"
            role="tab"
            :aria-selected="activeGroupView === group.id"
            @click.prevent="highlight(group.id)"
          >
            <span
              v-if="group.image"
              class="emoji-picker-header-image"
            >
              <StillImage
                :alt="group.text"
                :src="group.image"
              />
            </span>
            <FAIcon
              v-else
              :icon="group.icon"
              fixed-width
            />
          </button>
          <button
            v-if="stickerPickerEnabled"
            class="button-unstyled stickers-tab-icon"
            :class="{toggled: showingStickers}"
            :title="$t('emoji.stickers')"
            @click.prevent="toggleStickers"
            :aria-selected="showingStickers"
            role="tab"
          >
            <FAIcon
              icon="sticky-note"
              fixed-width
            />
          </button>
        </span>
      </div>
      <div
        v-if="contentLoaded"
        class="content"
      >
        <div
          class="emoji-content"
          :class="{hidden: showingStickers}"
        >
          <!-- Enables scrolling for this element on safari iOS. See comments for header. -->
          <DynamicScroller
            ref="emoji-groups"
            v-body-scroll-lock="isInModal"
            class="emoji-groups"
            :class="groupsScrolledClass"
            :min-item-size="minItemSize"
            :buffer="minItemSize"
            :items="emojiItems"
            :emit-update="true"
            @update="onScroll"
            @visible="recalculateItemPerRow"
            @resize="recalculateItemPerRow"
            role="tabpanel"
          >
            <template #default="{ item: group, index, active }">
              <DynamicScrollerItem
                :ref="setGroupRef('group-' + group.id)"
                :item="group"
                :active="active"
                :data-index="index"
                :size-dependencies="[group.emojis.length]"
              >
                <div
                  class="emoji-group"
                  :class="{ ['first-row']: group.isFirstRow }"
                  :style="{ '--__amount': itemPerRow }"
                >
                  <h1
                    v-if="group.isFirstRow"
                    class="emoji-group-title"
                  >
                    {{ group.text }}
                  </h1>
                  <button
                    v-for="emoji in group.emojis"
                    :key="group.id + emoji.displayText"
                    :title="maybeLocalizedEmojiName(emoji)"
                    class="button-unstyled emoji-item"
                    @click.stop.prevent="onEmoji(emoji)"
                  >
                    <span
                      v-if="!emoji.imageUrl"
                      class="emoji-picker-emoji -unicode"
                    >{{ emoji.replacement }}</span>
                    <StillImage
                      v-else
                      class="emoji-picker-emoji -custom"
                      loading="lazy"
                      :alt="maybeLocalizedEmojiName(emoji)"
                      :src="emoji.imageUrl"
                      :data-emoji-name="group.id + emoji.displayText"
                    />
                  </button>
                </div>
              </DynamicScrollerItem>
            </template>
          </DynamicScroller>
          <div class="keep-open">
            <Checkbox v-model="keepOpen">
              {{ $t('emoji.keep_open') }}
            </Checkbox>
          </div>
          <div
            v-if="!hideCustomEmoji"
            class="hide-custom-emoji"
          >
            <Checkbox
              v-model="hideCustomEmojiInPicker"
              @change="onShowing"
            >
              {{ $t('emoji.hide_custom_emoji') }}
            </Checkbox>
          </div>
        </div>
        <div
          v-if="showingStickers"
          class="stickers-content"
        >
          <sticker-picker
            @uploaded="onStickerUploaded"
            @upload-failed="onStickerUploadFailed"
          />
        </div>
      </div>
    </template>
  </Popover>
</template>

<script src="./emoji_picker.js"></script>
<style lang="scss" src="./emoji_picker.scss"></style>
