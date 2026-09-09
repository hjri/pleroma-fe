import { onMounted, onUnmounted, ref, nextTick } from 'vue'

export function useScrollPosition() {
  const x = ref(0)
  const y = ref(0)
  const inProgress = ref(false)

  const update = (e) => {
    x.value = window.scrollX
    y.value = window.scrollY
  }

  onMounted(() => {
    window.addEventListener('scroll', update)
    update()
  })
  onUnmounted(() => {
    window.removeEventListener('scroll', update)
  })

  const scrollBy = async (x1, y1, options) => {
    inProgress.value = true
    await window.scrollBy(x1, y1, options)
    inProgress.value = false
  }

  const scrollIntoView = async (element, options) => {
    inProgress.value = true
    await element.scrollIntoView(options)
    inProgress.value = false
  }

  return { x, y, scrollBy, scrollIntoView, inProgress }
}
