import { computed, ref } from 'vue'

import { useInterfaceSizes } from 'src/composables/useInterfaceSizes.js'

export function useScrollPosition(scroller) {
  const {
    x,
    y,
    cWidth,
    cHeight,
    vWidth,
    vHeight,
    scrollBy: realScrollBy,
    scrollTo: realScrollTo,
  } = scroller
  const priorityInProgress = ref(false)

  const top = computed(() => y.value)
  const bottom = computed(() => y.value + vHeight.value)
  const left = computed(() => x.value)
  const right = computed(() => x.value + vWidth.value)

  const distanceToTop = top
  const distanceToLeft = left
  const distanceToBottom = computed(() => cHeight.value - bottom.value)
  const distanceToRight = computed(() => cWidth.value - right.value)

  const { fontSize } = useInterfaceSizes()

  const reachMargin = computed(() => fontSize.value)
  const hasReachedTop = computed(() => distanceToTop.value < reachMargin.value)
  const hasReachedBottom = computed(
    () => distanceToBottom.value < reachMargin.value,
  )
  const hasReachedLeft = computed(
    () => distanceToLeft.value < reachMargin.value,
  )
  const hasReachedRight = computed(
    () => distanceToRight.value < reachMargin.value,
  )

  const loadMargin = computed(() => fontSize.value * 25)
  const shouldLoadTop = computed(() => distanceToTop.value < loadMargin.value)
  const shouldLoadBottom = computed(
    () => distanceToBottom.value < loadMargin.value,
  )
  const shouldLoadLeft = computed(() => distanceToLeft.value < loadMargin.value)
  const shouldLoadRight = computed(
    () => distanceToRight.value < loadMargin.value,
  )

  const scrollTo = async (...args) => {
    if (priorityInProgress.value) return true
    return await realScrollTo(...args)
  }
  const scrollBy = async (...args) => {
    if (priorityInProgress.value) return true
    return await realScrollBy(...args)
  }

  const scrollToPriority = async (...args) => {
    priorityInProgress.value = true
    const result = await realScrollTo(...args)
    priorityInProgress.value = false
    return result
  }
  const scrollByPriority = async (...args) => {
    priorityInProgress.value = true
    const result = await realScrollBy(...args)
    priorityInProgress.value = false
    return result
  }

  return {
    top,
    left,
    right,
    bottom,

    distanceToTop,
    distanceToLeft,
    distanceToRight,
    distanceToBottom,

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
    scrollTo,
    scrollByPriority,
    scrollToPriority,
  }
}
