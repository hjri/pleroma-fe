<template>
<Popover
  trigger="hover"
  tooltip
  :trigger-attrs="{ 'aria-label': props.text }"
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
