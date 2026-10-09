<template>
  <div
    class="range-control style-control"
    :class="{ disabled: !present || disabled }"
  >
    <label
      :id="name + '-label'"
      :for="name"
      class="label"
    >
      {{ label }}
    </label>
    <input
      v-if="fallback !== undefined"
      :title="$t('settings.style.themes3.define')"
      class="input -checkbox opt"
      type="checkbox"
      :checked="present"
      @change="$emit('update:modelValue', !present ? fallback : undefined)"
    >
    <input
      :id="name"
      class="input input-number"
      type="range"
      :value="modelValue || fallback"
      :disabled="!present || disabled"
      :max="max || hardMax || 100"
      :min="min || hardMin || 0"
      :step="step || 1"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <input
      :id="name + '-numeric'"
      class="input input-number"
      type="number"
      :title="label"
      :value="modelValue || fallback"
      :disabled="!present || disabled"
      :max="hardMax"
      :min="hardMin"
      :step="step || 1"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>

<script>
export default {
  props: {
    name: String,
    modelValue: String,
    fallback: Number,
    disabled: Boolean,
    label: String,
    max: Number,
    min: Number,
    step: Number,
    hardMin: Number,
    hardMax: Number,
  },
  emits: ['update:modelValue'],
  computed: {
    present() {
      return this.modelValue !== undefined
    },
  },
}
</script>
