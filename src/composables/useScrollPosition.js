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

  const scrollIntoView = async (element, options) => {
    if (element == null) throw new TypeError(`Element is ${element}!`)
    inProgress.value = true
    if (!element.scrollIntoViewIfNeeded) {
      const { height: windowHeight } = useWindowSize()
      const { top, height } = element.getBoundingClientRect()
      const bottom = top + height

      const biggerThanScreen = height > windowHeight
      const aboveTop = top < 0
      const belowBottom = bottom > windowHeight.value
      if (aboveTop || belowBottom || biggerThanScreen) {
        await element.scrollIntoView(options)
      }
    } else {
      await element.scrollIntoViewIfNeeded(options)
    }
    inProgress.value = false
  }

  return { x, y, scrollBy, scrollIntoView, inProgress }
}
