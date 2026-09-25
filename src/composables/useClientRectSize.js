import { onMounted, onUnmounted, ref, watch } from 'vue'

export function useClientRectSize(element) {
  const width = ref(0)
  const height = ref(0)

  const update = (entry) => {
    const contentRect = entry
      ? entry[0].contentRect
      : element.value.getBoundingClientRect()

    height.value = contentRect.height
    width.value = contentRect.width
  }

  const resizeObserver = new ResizeObserver(update)

  watch(element, (value) => {
    if (value) {
      resizeObserver.observe(element.value)
      update()
    }
  })

  onMounted(() => {
    if (element.value) {
      resizeObserver.observe(element.value)
      update()
    }
  })
  onUnmounted(() => resizeObserver.disconnect())

  return {
    width,
    height,
  }
}
