import { computed, ref, toValue, watch } from 'vue'

import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling({
  // List of items
  list,
  // Container of items, used for measuring scroll position
  body,
  // useScrollPosition composable, used to prevent dupicating instances
  scrollPositionInstance,
  // ID of anchor element, used for scroll compensation.
  // Omitting it makes last element the anchor
  anchorId,
  // whether to use scroll compensation when elements above anchor change
  scrollCompensation,
  // Placeholder height specification. Must be a function.
  // function will be called either:
  // - without arguments (for generic placeholder, i.e. buffer zone size)
  // - with id (for specific item placeholders)
  // function must return ref pointing to height
  getPlaceholderHeight,
}) {
  // # Suspension
  const unsuspendibleIds = ref(new Set())
  const changeSuspendState = ({ id, suspend }) => {
    if (!suspend) {
      unsuspendibleIds.value.add(id)
    } else {
      unsuspendibleIds.value.delete(id)
    }
  }

  // # Heights mapping.
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
  const updateVirtualHeight = ({ id, height }) => {
    heights.value.set(id, height)
  }

  // ## Scroll compensation
  const {
    y: scrollY,
    inProgress: scrollInProgress,
    scrollBy,
  } = scrollPositionInstance
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
      // Scroll by amount offset changed to keep it in view
      topScrollBoundary.value += diff
      bottomScrollBoundary.value += diff
      scrollBy(0, diff)
    }

    resumeWatchers()
  })

  const { height: windowHeight } = useWindowSize()

  // Real scroll boundary, relative to body's bounds
  const topScrollBoundary = ref(0)
  const bottomScrollBoundary = ref(0)

  const updateBoundaries = () => {
    if (!body.value) return // Not mounted yet

    const { top } = body.value.getBoundingClientRect()

    const distanceItemTopToWindowTop = 0 - top
    const distanceItemTopToWindowBottom = windowHeight.value - top

    // Technically, bottom scroll boundary should be distance
    // from element's top border to window's bottom border,
    // but it just so happens that it is equal to this.
    // You can verify it by drawing the boxes and measuring
    // distances yourself, I know I did. Geometry, man...
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
  const resumeWatchers = (skipUpdate = false) => {
    windowWatcher.resume()
    scrollWatcher.resume()
    heightWatcher.resume()
    bodyWatcher.resume()
    if (skipUpdate) return
    updateBoundaries()
  }

  // # Visiblity
  // Add buffer zone to boundary, equal to approx 3 items heights
  const buffer = computed(() => getPlaceholderHeight().value * 3)

  const heightChartGrouped = computed(() => {
    // Determine visibility state
    const chart = heightChart.value.map((heightChartItem) => {
      const itemTopBoundary = heightChartItem.top
      const itemBottomBoundary = heightChartItem.top + heightChartItem.height

      // Include buffer zone
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
      // Bottom value isn't really used otherwise for debugging
      const present = visible || !suspendable
      if (present) {
        return [...acc, { type: 'item', height, top, bottom, id, item }]
      } else {
        // Reusing previous item if possible
        const previousItem = acc[acc.length - 1]
        const usingPreviousItem = previousItem?.type === 'spacer'
        // We only really care for height and id of spacer, everything else
        // is just for debugging
        const spacer = usingPreviousItem
          ? previousItem
          : {
              type: 'spacer',
              top: Number.POSITIVE_INFINITY,
              bottom: Number.POSITIVE_INFINITY,
              height: 0,
              ids: new Set(),
            }

        spacer.ids.add(id)
        spacer.id = [...spacer.ids].join() // used for v-for key attribute
        spacer.height += height

        if (top < spacer.top) spacer.top = top
        if (bottom < spacer.bottom) spacer.bottom = bottom

        // If we used previous item there is no need to push it to array
        if (usingPreviousItem) {
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
    pauseWatchers,
    resumeWatchers,
  }
}
