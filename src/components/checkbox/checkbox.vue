<template>
  <label
    class="checkbox"
    :class="[{ disabled, indeterminate, 'indeterminate-fix': indeterminateTransitionFix }, radio ? '-radio' : '-checkbox']"
  >
    <span
      v-if="!!$slots.before"
      class="label -before"
      :class="{ faint: disabled }"
    >
      <slot name="before" />
    </span>
    <input
      type="checkbox"
      class="visible-for-screenreader-only"
      :disabled="disabled"
      :checked="modelValue"
      :indeterminate="indeterminate"
      @change="$emit('update:modelValue', $event.target.checked)"
    >
    <i
      class="input checkbox-indicator"
      :aria-hidden="true"
      :class="[{ disabled }, radio ? '-radio' : '-checkbox']"
      @transitionend.capture="onTransitionEnd"
    />
    <span
      v-if="!!$slots.default"
      class="label -after"
      :class="{ faint: disabled }"
    >
      <slot />
    </span>
  </label>
</template>

<script>
export default {
  props: [
    'radio',
    'modelValue',
    'indeterminate',
    'disabled'
  ],
  emits: ['update:modelValue'],
  data: (vm) => ({
    indeterminateTransitionFix: vm.indeterminate
  }),
  watch: {
    indeterminate (e) {
      if (e) {
        this.indeterminateTransitionFix = true
      }
    }
  },
  methods: {
    onTransitionEnd () {
      if (!this.indeterminate) {
        this.indeterminateTransitionFix = false
      }
    }
  }
}
</script>

<style lang="scss">
.checkbox {
  position: relative;
  display: inline-block;
  min-height: 1.2em;

  &-indicator,
  & .label {
    vertical-align: middle;
  }

  & > &-indicator {
    /* Reset .input stuff */
    padding: 0;
    margin: 0;
    position: relative;
    line-height: inherit;
    display: inline-block;
    width: 1.2em;
    height: 1.2em;
    box-shadow: none;

    --_shadow: var(--shadow);
  }

  &-indicator::before {
    position: absolute;
    inset: 0;
    display: block;
    content: "✓";
    transition: color 200ms;
    width: 1.1em;
    height: 1.1em;
    border-radius: var(--roundness);
    box-shadow: var(--_shadow);
    background-color: var(--background);
    vertical-align: top;
    text-align: center;
    line-height: 1.1em;
    font-size: 1.1em;
    color: transparent;
    overflow: hidden;
    box-sizing: border-box;
  }

  &.-radio {
    .checkbox-indicator {
      &,
      &::before {
        border-radius: 9999px;
      }

      &::before {
        content: "•";
      }
    }
  }

  .disabled {
    .checkbox-indicator::before {
      background-color: var(--background);
    }
  }

  input[type="checkbox"] {
    &:checked + .checkbox-indicator::before {
      color: var(--text);
    }

    &:indeterminate + .checkbox-indicator::before {
      content: "–";
      color: var(--text);
    }
  }

  &.indeterminate-fix {
    input[type="checkbox"] + .checkbox-indicator::before {
      content: "–";
    }
  }

  & > .label {
    &.-after {
      margin-left: 0.5em;
    }

    &.-before {
      margin-right: 0.5em;
    }
  }
}
</style>
