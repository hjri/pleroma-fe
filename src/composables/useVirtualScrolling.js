import { computed, ref, toValue, watch } from 'vue'

import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling({
  list,
  body,
  scrollPositionInstance,
  scrollCompensation,
  anchorId,
  getPlaceholderHeight,
}) {
  const unsuspendibleIds = ref(new Set())
  const changeSuspendState = ({ id, suspend }) => {
    if (!suspend) {
      unsuspendibleIds.value.add(id)
    } else {
      unsuspendibleIds.value.delete(id)
    }
  }

  // Add buffer zone to boundary, equal to approx 3 items heights
  const buffer = computed(() => getPlaceholderHeight().value * 3)

  // Heights map.
  const heights = ref(new Map())
  const heightChart = computed(() => {
    // Map every height and suspendable state
    const chart = list.value.map((item) => {
      const { id } = item
      const height =
        (() => {
          if (heights.value.has(id)) {
            return heights.value.get(id)
          } else {
            return getPlaceholderHeight(id).value
          }
        })() + 1 //including border
      const suspendable = !unsuspendibleIds.value.has(id)
      return { id, height, suspendable, item }
    })

    // Walk over the list to set top offsets
    chart.reduce((sum, item) => {
      item.top = sum
      return sum + item.height
    }, 0)

    return chart
  })

  // Scroll compensation
  watch(heightChart, async (newVal, oldVal) => {
    if (!toValue(scrollCompensation)) return
    if (scrollInProgress.value) return
    pauseWatchers()

    // If we're not given an achor, treat last element as one
    const getAnchoredEl = (list) =>
      anchorId?.value
        ? list.find(({ id }) => id === anchorId?.value)
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
  const updateVirtualHeight = ({ id, height }) => {
    heights.value.set(id, height)
  }

  // Scrolling
  const {
    y: scrollY,
    inProgress: scrollInProgress,
    scrollBy,
  } = scrollPositionInstance
  const { height: windowHeight } = useWindowSize()

  // Real scroll boundary relative to body's bounds
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
  const heightWatcher = watch(heightChart, updateBoundaries)
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

    // Group invisible items into spacers
    return chart.reduce((acc, heightChartItem) => {
      const { suspendable, visible, height, top, bottom, id, item } =
        heightChartItem
      const present = visible || !suspendable
      if (present) {
        return [...acc, { type: 'item', height, top, bottom, id, item }]
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
