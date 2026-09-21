import { onMounted, onUnmounted, ref } from 'vue'

export function useScrollPosition(scroller) {
  const { x, y, cWidth, cHeight, vWidth, vHeight } = scroller

  const top = computed(() => y.value)
  const bottom = computed(() => y.value + vHeight.value)
  const left = computed(() => x.value)
  const right = computed(() => x.value + vWidth.value)

  const margin = 15
  const hasReachedTop = computed(() => top.value < margin)
  const hasReachedBottom = computed(() => bottom.value - cHeight.value < margin)
  const hasReachedLeft = computed(() => left.value < margin)
  const hasReachedRight = computed(() => right.value - cWidth.value < margin)

  return {
    top,
    left,
    right,
    bottom,
    hasReachedLeft,
    hasReachedRight,
    hasReachedTop,
    hasReachedBottom,
  }
}
