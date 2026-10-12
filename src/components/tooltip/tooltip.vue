<template>
<Popover
  trigger="hover"
  tooltip
  :label="label"
  :aria-describedby="idPrefix + 'content'"
  v-bind="$attrs"
>
  <template #trigger>
    <slot />
  </template>
  <template #content>
    <div class="tooltip" role="tooltip" :id="idPrefix + 'content'">
      {{ props.text }}
    </div>
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
  margin: 0.5em 1em;
}
</style>
