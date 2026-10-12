<template>
  <component
    ref="trigger"
    :is="link ? 'a' : 'button'"
    :type="link ? undefined : 'button'"
    class="popover-trigger-button"
    :class="triggerClass"
    :aria-haspopup="ariaHasPopup"
    :aria-owns="hidden ? undefined : `${idPrefix}content`"
    :aria-expanded="!hidden ? 'true' : 'false'"
    :aria-label="label"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
    @keydown.tab.exact="onTab"
    @keydown.tab.shift.exact="hidePopover"
    v-bind="allTriggerAttrs"
  >
    <slot name="trigger" />
    <teleport
      :disabled="!teleport"
      to="#popovers"
    >
      <transition name="fade">
        <div
          v-if="!hidden"
          :id="($attrs.id ?? idPrefix) + 'content'"
          ref="content"
          :style="styles"
          class="popover"
          :role="tooltip ? 'tooltip' : 'dialog'"
          :aria-label="$attrs['aria-label']"
          :class="popoverClass || 'popover-default'"
          @mouseenter="onMouseenterContent"
          @mouseleave="onMouseleaveContent"
          @click="onClickContent"
        >
          <span
            class="focus-trap -before"
            aria-hidden="1"
            tabindex="0"
            @focus="onReverseTabContentFocus"
          />
          <slot
            name="content"
            class="popover-inner"
            :close="hidePopover"
            :resize="resizePopover"
          />
          <span
            class="focus-trap -after"
            aria-hidden="1"
            tabindex="0"
            @focus="onForwardTabContentFocus"
          />
        </div>
      </transition>
    </teleport>
  </component>
</template>

<script src="./popover.js" />

<style src="./popover.scss" lang="scss"></style>
