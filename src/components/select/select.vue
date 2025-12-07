<template>
  <label
    class="Select input"
    :class="{ disabled, unstyled }"
  >
    <select
      :disabled="disabled"
      :value="modelValue"
      v-bind="$attrs"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <slot />
    </select>
    {{ ' ' }}
    <FAIcon
      v-if="!$attrs.size && !$attrs.multiple"
      class="select-down-icon"
      icon="chevron-down"
    />
  </label>
</template>

<script src="./select.js"> </script>

<style lang="scss">
/* TODO fix order of styles */
label.Select {
  padding: 0;
  display: flex;

  select {
    appearance: none;
    background: transparent;
    border: none;
    color: var(--text);
    margin: 0;
    padding: 0 2em 0 0.5em;
    font-family: var(--font);
    font-size: 1em;
    width: 100%;
    z-index: 1;
    line-height: 2;

    &[multiple],
    &[size] {
      height: 100%;
      padding: 0.2em;

      option {
        background-color: transparent;

        &:checked,
        &.-active {
          color: var(--selectionText);
          background-color: var(--selectionBackground);
        }
      }
    }
  }

  &.disabled,
  &:disabled {
    background-color: var(--background);
    opacity: 1; /* override browser */
    color: var(--faint);

    select {
      &[multiple],
      &[size] {
        option.-active {
          color: var(--faint);
          background: transparent;
        }
      }
    }
  }

  .select-down-icon {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0.5em;
    height: 100%;
    width: 0.875em;
    font-family: var(--font);
    line-height: 2;
    z-index: 1;
    pointer-events: none;
  }
}
</style>
