<template>
  <component
    :is="link ? 'a' : 'button'"
    :type="link ? undefined : 'button'"
    :aria-haspopup="tooltip ? undefined : !disabled"
    :aria-owns="hidden ? undefined : `${idPrefix}content`"
    class="popover-trigger-button"
    :class="triggerClass"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @click="onClick"
    v-bind="allTriggerAttrs"
    ref="trigger"
  >
    <slot name="trigger" />
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
  </component>
</template>

<script src="./popover.js" />

<style src="./popover.scss" lang="scss"></style>
