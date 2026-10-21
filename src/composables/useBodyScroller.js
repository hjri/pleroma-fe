import { computed } from 'vue'

import { useClientRectSize } from 'src/composables/useClientRectSize.js'

export function useBodyScroller(windowScroller, windowSize) {
  const element = computed(() => window.document.body)
  const { x, y, scrollBy, scrollTo } = windowScroller
  const { width: vWidth, height: vHeight } = windowSize
  const { width: cWidth, height: cHeight } = useClientRectSize(element)

  return { x, y, vWidth, vHeight, cWidth, cHeight, scrollBy, scrollTo }
}
