<template>
<Popover
  trigger="hover"
  tooltip
  v-bind="{ 'aria-label': props.text, ...$attrs }"
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
import { useId, computed } from 'vue'

import Popover from 'src/components/popover/popover.vue'

const props = defineProps({ text: String })
const uniqueId = useId()
const idPrefix = computed(() => `tooltip-${uniqueId.value}`)
</script>

<style lang="scss">
.tooltip {
  margin: 0.5em 1em;
}
</style>
