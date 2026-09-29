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
      @click.prevent="onClick"
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
