import { onMounted, onUnmounted, ref } from 'vue'

import { useWindowSize } from 'src/composables/useWindowSize.js'

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

  const scrollBy = async (...args) => {
    inProgress.value = true
    await window.scrollBy(...args)
    inProgress.value = false
  }

  return { x, y, scrollBy, inProgress }
}
