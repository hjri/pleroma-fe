<template>
  <span
    class="popover-wrapper"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <button
      ref="trigger"
      class="popover-trigger-button"
      :class="normalButton ? 'button-default btn' : 'button-unstyled'"
      type="button"
      v-bind="allTriggerAttrs"
      @click="onClick"
    >
      <slot name="trigger" />
    </button>
    <teleport
      :disabled="!teleport"
      to="#popovers"
    >
      <transition name="fade">
        <div
          v-if="!hidden"
          ref="content"
          :style="styles"
          class="popover"
          :class="popoverClass || 'popover-default'"
          @mouseenter="onMouseenterContent"
          @mouseleave="onMouseleaveContent"
          @click="onClickContent"
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
