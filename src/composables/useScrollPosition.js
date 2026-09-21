import { computed } from 'vue'

export function useScrollPosition(scroller) {
  const { x, y, cWidth, cHeight, vWidth, vHeight, scrollBy } = scroller

  const top = computed(() => y.value)
  const bottom = computed(() => y.value + vHeight.value)
  const left = computed(() => x.value)
  const right = computed(() => x.value + vWidth.value)

  const distanceToTop = top
  const distanceToLeft = left
  const distanceToBottom = computed(() => cHeight.value - bottom.value)
  const distanceToRight = computed(() => cWidth.value - right.value)

  const reachMargin = 15
  const hasReachedTop = computed(() => distanceToTop.value < reachMargin)
  const hasReachedBottom = computed(() => distanceToBottom.value < reachMargin)
  const hasReachedLeft = computed(() => distanceToLeft.value < reachMargin)
  const hasReachedRight = computed(() => distanceToRight.value < reachMargin)

  const loadMargin = 750
  const shouldLoadTop = computed(() => distanceToTop.value < loadMargin)
  const shouldLoadBottom = computed(() => distanceToBottom.value < loadMargin)
  const shouldLoadLeft = computed(() => distanceToLeft.value < loadMargin)
  const shouldLoadRight = computed(() => distanceToRight.value < loadMargin)

  return {
    top,
    left,
    right,
    bottom,

    cWidth,
    cHeight,
    vWidth,
    vHeight,

    hasReachedLeft,
    hasReachedRight,
    hasReachedTop,
    hasReachedBottom,

    shouldLoadLeft,
    shouldLoadRight,
    shouldLoadTop,
    shouldLoadBottom,

    scrollBy,
  }
}
