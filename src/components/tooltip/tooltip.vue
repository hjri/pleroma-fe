<template>
  <Popover trigger="hover" tooltip v-bind="$attrs">
    <template #trigger>
      <slot />
    </template>
    <template #content>
      <div class="tooltip" role="tooltip">
        {{ props.text }}
      </div>
    </template>
  </Popover>
</template>

<script setup>
import Popover from 'src/components/popover/popover.vue'

const props = defineProps({ text: String })
</script>

<style lang="scss">
.tooltip {
  margin: 0.5em 1em;
}
</style>
