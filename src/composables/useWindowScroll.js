import { onMounted, onUnmounted, ref } from 'vue'

export function useWindowScroll() {
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

  const scrollBy = (...args) => window.scrollBy(...args)
  const scrollTo = (...args) => window.scrollTo(...args)

  return { x, y, scrollBy, scrollTo }
}
