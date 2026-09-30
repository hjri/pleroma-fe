<template>
  <span
    class="popover-wrapper"
    role="presentation"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <component
      ref="trigger"
      :is="link ? 'a' : 'button'"
      class="popover-trigger-button"
      :class="triggerClass"
      type="button"
      v-bind="allTriggerAttrs"
      :aria-haspopup="tooltip ? undefined : !disabled"
      :aria-owns="hidden ? undefined : `${idPrefix}content`"
      @click="onClick"
    >
      <slot name="trigger" />
    </component>
    <teleport
      :disabled="!teleport"
      to="#popovers"
    >
      <transition name="fade">
        <div
          v-if="!hidden"
          :id="$attrs.id ?? idPrefix + 'content'"
          ref="content"
          :style="styles"
          class="popover"
          role="dialog"
          :aria-label="$attrs['aria-label']"
          :class="popoverClass || 'popover-default'"
          @mouseenter="onMouseenterContent"
          @mouseleave="onMouseleaveContent"
          @click="onClickContent"
          v-bind="$attrs"
        >
          <slot
            name="content"
            class="popover-inner"
            :close="hidePopover"
            :resize="resizePopover"
          />
        </div>
      </transition>
    </teleport>
  </span>
</template>

<script src="./popover.js" />

<style src="./popover.scss" lang="scss"></style>
