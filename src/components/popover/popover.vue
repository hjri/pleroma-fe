<template>
  <router-link
    v-if="routerLink"
    :to="$attrs.to"
    custom
    v-slot="{ href, navigate }"
  >
    <a
      ref="trigger"
      class="popover-trigger-button"
      :href="href"

      :aria-haspopup="ariaHasPopup"
      :aria-owns="hidden ? undefined : `${idPrefix}content`"
      :aria-description="trigger === 'click' ? $t('general.popover_link_a11y') : undefined"
      :aria-describedby="tooltip ? `${idPrefix}content` : undefined"
      :aria-expanded="!hidden ? 'true' : 'false'"
      :aria-label="label ?? $attrs['aria-label']"

      @mouseenter="onMouseenter"
      @mouseleave="onMouseleave"
      @click="e => onClick(e, navigate)"
      @focus="onFocus"
      @blur="onBlur"
      @keydown.tab.exact="onTab"
      @keydown.tab.shift.exact="hidePopover"
      v-bind="allTriggerAttrs"
    >
      <slot name="trigger"/>
    </a>
  </router-link>
  <a
    v-else-if="link"
    ref="trigger"
    class="popover-trigger-button"
    :href="$attrs.href"
    target="_blank"

    :aria-haspopup="ariaHasPopup"
    :aria-owns="hidden ? undefined : `${idPrefix}content`"
    :aria-description="trigger === 'click' ? $t('general.popover_link_a11y') : undefined"
    :aria-describedby="tooltip ? `${idPrefix}content` : undefined"
    :aria-expanded="!hidden ? 'true' : 'false'"
    :aria-label="label ?? $attrs['aria-label']"

    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
    @keydown.tab.exact="onTab"
    @keydown.tab.shift.exact="hidePopover"
    v-bind="allTriggerAttrs"
  >
    <slot name="trigger"/>
  </a>
  <button
    v-else
    ref="trigger"
    class="popover-trigger-button"
    :class="triggerClass"
    type="button"

    :aria-haspopup="ariaHasPopup"
    :aria-owns="hidden ? undefined : `${idPrefix}content`"
    :aria-describedby="tooltip ? `${idPrefix}content` : undefined"
    :aria-expanded="!hidden ? 'true' : 'false'"
    :aria-label="label ?? $attrs['aria-label']"

    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
    @click="onClick"
    @focus="onFocus"
    @blur="onBlur"
    @keydown.tab.exact="onTab"
    @keydown.tab.shift.exact="hidePopover"
    v-bind="allTriggerAttrs"
  >
    <slot name="trigger"/>
  </button>
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
</template>

<script src="./popover.js" />

<style src="./popover.scss" lang="scss"></style>
