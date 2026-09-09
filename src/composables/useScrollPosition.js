import { onMounted, onUnmounted, ref } from 'vue'

export function useScrollPosition() {
  const x = ref(0)
  const y = ref(0)

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

  return { x, y }
}
