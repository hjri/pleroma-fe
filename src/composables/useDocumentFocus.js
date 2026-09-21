import { onMounted, onUnmounted, ref } from 'vue'

export function useDocumentFocus() {
  const focused = ref(false)

  const handleVisibilityChange = async () => {
    focused.value = !document.hidden
  }

  onMounted(async () => {
    if (document.hidden !== undefined) {
      document.addEventListener(
        'visibilitychange',
        handleVisibilityChange,
        false,
      )
    }

    await nextTick()
  })

  onUnmounted(() => {
    if (document.hidden !== undefined) {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
        false,
      )
    }
  })

  return {
    focused,
  }
}
