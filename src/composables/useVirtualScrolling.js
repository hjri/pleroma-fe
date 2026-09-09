import { storeToRefs } from 'pinia'
import { computed, ref, toValue, watch } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling(
  conversation,
  body,
  scrollPosition,
  scrollCompensation,
  anchorStatus,
) {
  const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)

  const { mergedConfig } = storeToRefs(useMergedConfigStore())
  const anchor = computed(() => anchorStatus?.value.id)

  const unsuspendibleIds = ref(new Set())
  const changeSuspendState = ({ id, suspend }) => {
    if (!suspend) {
      unsuspendibleIds.value.add(id)
    } else {
      unsuspendibleIds.value.delete(id)
    }
  }

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

  // Placeholder heights.
  const mutedStatusHeight = computed(() => {
    return fontSize.value * 1.5
  })
  const normalStatusHeight = computed(() => {
    return fontSize.value * 10
  })

  // Add buffer zone to boundary, equal to approx 3 statuses heights
  const buffer = computed(() => normalStatusHeight.value * 3)

  // Heights map.
  const heights = ref(new Map())
  const totalHeight = computed(() =>
    conversation.value.reduce((acc, item) => {
      if (heights.value.has(item.id)) {
        return acc + heights.value.get(item.id)
      } else if (item.muted) {
        return acc + mutedStatusHeight.value
      } else {
        return acc + normalStatusHeight.value
      }
    }, 0),
  )
  const updateVirtualHeight = ({ id, height }) => {
    heights.value.set(id, height)
  }

  // Scrolling
  const { y: scrollY, inProgress: scrollInProgress, scrollBy } = scrollPosition
  const { height: windowHeight } = useWindowSize()

  const topScrollBoundary = ref(0)
  const bottomScrollBoundary = ref(0)
  const updateBoundaries = () => {
    if (!body.value) return // Not mounted yet

    const { top } = body.value.getBoundingClientRect()

    const distanceItemTopToWindowTop = 0 - top
    const distanceItemTopToWindowBottom = windowHeight.value - top

    topScrollBoundary.value = distanceItemTopToWindowTop
    bottomScrollBoundary.value = distanceItemTopToWindowBottom
  }
  const windowWatcher = watch(windowHeight, updateBoundaries)
  const scrollWatcher = watch(scrollY, updateBoundaries)
  const heightWatcher = watch(totalHeight, updateBoundaries)
  const bodyWatcher = watch(body, updateBoundaries)
  const pauseWatchers = () => {
    windowWatcher.pause()
    scrollWatcher.pause()
    heightWatcher.pause()
    bodyWatcher.pause()
  }
  const resumeWatchers = () => {
    windowWatcher.resume()
    scrollWatcher.resume()
    heightWatcher.resume()
    bodyWatcher.resume()
  }

  const heightChart = computed(() => {
    // Map every height and suspendable state
    const chart = conversation.value.map(({ id }) => {
      const status = getStatusObject(id)
      const height =
        (() => {
          if (heights.value.has(id)) {
            return heights.value.get(id)
          } else if (status?.muted) {
            return mutedStatusHeight.value
          } else {
            return normalStatusHeight.value
          }
        })() + 1 //including border
      const suspendable = !unsuspendibleIds.value.has(id)
      return { id, height, suspendable, status }
    })

    // Walk over the list to set top offsets
    chart.reduce((sum, item) => {
      item.top = sum
      return sum + item.height
    }, 0)

    return chart
  })

  watch(heightChart, async (newVal, oldVal) => {
    if (!toValue(scrollCompensation)) return
    if (scrollInProgress.value) return
    pauseWatchers()
    const getAnchoredEl = (list) =>
      anchor.value
        ? list.find(({ id }) => id === anchor.value)
        : list[list.length - 1]
    const oldElement = getAnchoredEl(oldVal)
    const newElement = getAnchoredEl(newVal)
    const oldOffset = oldElement?.top ?? 0
    const newOffset = newElement?.top ?? 0

    const diff = newOffset - oldOffset // Positive = down, Negative = up

    if (diff !== 0) {
      topScrollBoundary.value += diff
      bottomScrollBoundary.value += diff
      scrollBy(0, diff)
    }

    updateBoundaries()
    resumeWatchers()
  })

  const heightChartGrouped = computed(() => {
    // Determine visibility state
    const chart = heightChart.value.map((heightChartItem) => {
      const itemBottomBoundary = heightChartItem.top + heightChartItem.height
      const itemTopBoundary = heightChartItem.top

      const finalTopScrollBoundary = topScrollBoundary.value - buffer.value
      const finalBottomScrollBoundary =
        bottomScrollBoundary.value + buffer.value

      // To be visible, item's bottom boundary shoud be below top scroll boundary)
      const isBelowTopBoundary = itemBottomBoundary > finalTopScrollBoundary
      // To be visible, item's top boundary shoud be above bottom scroll boundary)
      const isAboveBottomBoundary = itemTopBoundary < finalBottomScrollBoundary
      // This accounts for the case where item's boundaries exceed scroll boundary

      return {
        ...heightChartItem,
        visible: isBelowTopBoundary && isAboveBottomBoundary,
      }
    })

    // Group invisible statuses into spacers
    return chart.reduce((acc, heightChartItem) => {
      const { suspendable, visible, height, top, bottom, id, status } =
        heightChartItem
      const present = visible || !suspendable
      if (present) {
        return [...acc, { type: 'status', height, top, bottom, id, status }]
      } else {
        const previousItem = acc[acc.length - 1]
        const spacer =
          previousItem?.type === 'spacer'
            ? previousItem
            : {
                type: 'spacer',
                top: Number.POSITIVE_INFINITY,
                bottom: Number.POSITIVE_INFINITY,
                height: 0,
                ids: new Set(),
              }

        spacer.ids.add(id)
        spacer.id = [...spacer.ids].join()
        spacer.height += height
        if (top < spacer.top) spacer.top = top
        if (bottom < spacer.bottom) spacer.bottom = bottom

        if (previousItem?.type === 'spacer') {
          return acc
        } else {
          return [...acc, spacer]
        }
      }
    }, [])
  })

  return {
    heightChart: heightChartGrouped,
    changeSuspendState,
    updateVirtualHeight,
  }
}
