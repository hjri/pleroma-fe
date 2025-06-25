<template>
  <div
    class="action-button"
    :class="buttonClass"
  >
    <component
      :is="getComponent(button)"
      class="action-button-inner"
      :class="buttonInnerClass"
      role="menuitem"
      type="button"
      :title="$t(button.label(funcArg))"
      target="_blank"
      :tabindex="0"
      :disabled="button.interactive ? !button.interactive(funcArg) : false"
      :href="getComponent(button) == 'a' ? button.link?.(funcArg) || remoteInteractionLink : undefined"
      @click="doActionWrap(button, outerClose)"
    >
      <FALayers>
        <FAIcon
          class="fa-scale-110"
          :icon="button.icon(funcArg)"
          :spin="!extra && getComponent(button) == 'button' && button.animated?.() && animationState"
          :style="{ '--fa-animation-duration': '750ms' }"
          fixed-width
        />
        <template v-if="!buttonClass.disabled && (!button.interactive || button?.interactive(funcArg)) && button.toggleable?.(funcArg) && button.active">
          <FAIcon
            v-if="button.active(funcArg)"
            class="active-marker"
            transform="shrink-6 up-9 right-15"
            :icon="button.activeIndicator?.(funcArg) || 'check'"
          />
          <FAIcon
            v-if="!button.active(funcArg)"
            class="focus-marker"
            transform="shrink-6 up-9 right-15"
            :icon="button.openIndicator?.(funcArg) || 'plus'"
          />
          <FAIcon
            v-else
            class="focus-marker"
            transform="shrink-6 up-9 right-15"
            :icon="button.closeIndicator?.(funcArg) || 'minus'"
          />
        </template>
      </FALayers>
      <span
        v-if="extra"
        class="action-label"
      >
        {{ $t(button.label(funcArg)) }}
      </span>
      <FAIcon
        v-if="button.dropdown?.()"
        class="chevron-icon"
        size="lg"
        :icon="extra ? 'chevron-right' : 'chevron-up'"
        fixed-width
      />
    </component>
    <span
      v-if="!extra && button.counter?.(funcArg) > 0"
      class="action-counter"
    >
      {{ button.counter?.(funcArg) }}
    </span>
    <span
      v-if="!extra && button.name === 'bookmark'"
      class="separator"
    />
    <Popover
      v-if="button.name === 'bookmark'"
      :trigger="extra ? 'hover' : 'click'"
      :placement="extra ? 'right' : 'top'"
      :offset="extra ? { x: 10 } : { y: 10 }"
      :trigger-attrs="{ class: 'extra-button' }"
    >
      <template #trigger>
        <FAIcon
          class="chevron-icon"
          size="lg"
          :icon="extra ? 'chevron-right' : 'chevron-up'"
          fixed-width
        />
      </template>
      <template #content="{close}">
        <StatusBookmarkFolderMenu
          v-if="button.name === 'bookmark'"
          :status="status"
          :close="() => { close(); outerClose() }"
        />
      </template>
    </Popover>

    <EmojiPicker
      v-if="button.name === 'emoji'"
      ref="picker"
      :enable-sticker-picker="false"
      :hide-custom-emoji="hideCustomEmoji"
      class="emoji-picker-panel"
      @emoji="addReaction"
    />
  </div>
</template>

<script src="./action_button.js" />

<style lang="scss" src="./action_button.scss" />
