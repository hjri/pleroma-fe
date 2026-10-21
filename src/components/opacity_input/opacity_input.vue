<template>
  <div
    class="opacity-control style-control"
    :class="{ disabled: !present || disabled }"
  >
    <label
      :for="name"
      class="label"
      :class="{ faint: !present || disabled }"
    >
      {{ label || $t('settings.style.themes3.editor.opacity') }}
    </label>
    <Checkbox
      v-if="fallback !== undefined"
      :model-value="present"
      :disabled="disabled"
      class="opt"
      @update:model-value="$emit('update:modelValue', !present ? fallback : undefined)"
    />
    <input
      :id="name"
      class="input input-number"
      type="number"
      :value="modelValue || fallback"
      :disabled="!present || disabled"
      :class="{ disabled: !present || disabled }"
      max="1"
      min="0"
      step=".05"
      @input="$emit('update:modelValue', $event.target.value)"
    >
  </div>
</template>

<script>
import Checkbox from 'src/components/checkbox/checkbox.vue'
export default {
  components: {
    Checkbox,
  },
  props: {
    name: String,
    label: String,
    modelValue: Number,
    fallback: Number,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  computed: {
    present() {
      return this.modelValue !== undefined
    },
  },
}
</script>
