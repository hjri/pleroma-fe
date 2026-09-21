import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'

export function useInterfaceSizes() {
  const { mergedConfig } = storeToRefs(useMergedConfigStore())

  // Getting the actual font size in pixels since UI might have
  // a different scale
  const fontSizeSetting = computed(() => mergedConfig.value.textSize)
  const fontSize = ref(0)
  const updateFontSize = () => {
    const string = window
      .getComputedStyle(document.body)
      .getPropertyValue('font-size')
    fontSize.value = Number.parseInt(string.slice(0, -2), 10) // remove the 'px'
  }
  // Update font size if user changed UI scale
  watch(fontSizeSetting, updateFontSize, { immediate: true })

  const navbarSize = computed(() => {
    const string = window
      .getComputedStyle(document.body)
      .getPropertyValue('--navbar-height')

    return fontSize.value * Number.parseInt(string.slice(0, -3), 10) // remove the 'rem'
  })

  const panelHeaderSize = computed(() => {
    const string = window
      .getComputedStyle(document.body)
      .getPropertyValue('--panel-header-height')

    return fontSize.value * Number.parseInt(string.slice(0, -3), 10) // remove the 'rem'
  })

  return {
    fontSize,
    navbarSize,
    panelHeaderSize,
  }
}
