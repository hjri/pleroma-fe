import { onMounted, onUnmounted, ref } from 'vue'

export function useWindowSize() {
  const height = ref(0)
  const width = ref(0)

  const update = () => {
    height.value = window.innerHeight
    width.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  update()

  return { height, width }
}
