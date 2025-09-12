<template>
  <div
    class="list"
    role="list"
  >
    <div
      v-for="item in items"
      :key="getKey(item)"
      class="list-item"
      :class="[getClass(item), nonInteractive ? '-non-interactive' : '']"
      role="listitem"
    >
      <slot
        name="item"
        :item="item"
      />
    </div>
    <div
      v-if="items.length === 0 && !!$slots.empty"
      class="list-empty-content faint"
    >
      <slot name="empty" />
      <slot name="load" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      default: () => []
    },
    getKey: {
      type: Function,
      default: item => item.id
    },
    getClass: {
      type: Function,
      default: () => ''
    },
    nonInteractive: {
      type: Boolean,
      default: false
    }
  }
}
</script>
