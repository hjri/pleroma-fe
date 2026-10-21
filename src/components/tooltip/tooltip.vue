<template>
<Popover
  trigger="hover"
  tooltip
  :label="label"
  popover-class="popover-default tooltip"
  v-bind="$attrs"
>
  <template #trigger>
    <slot />
  </template>
  <template #content>
    {{ props.text }}
  </template>
</Popover>
</template>

<script setup>
import { computed, useId } from 'vue'

import Popover from 'src/components/popover/popover.vue'

const props = defineProps({ text: String, label: String })
const uniqueId = useId()
const idPrefix = computed(() => `tooltip-${uniqueId}`)
</script>

<style lang="scss">
.tooltip {
  padding: 0.5em 1em;
}
</style>
