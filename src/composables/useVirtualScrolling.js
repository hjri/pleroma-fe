import { last, first } from 'lodash-es'
import { computed, nextTick, ref, toValue, watch } from 'vue'

import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling({
  // List of items
  list,
  // Container of items, used for measuring scroll position
  body,
  // useScrollPosition composable, used to prevent dupicating instances
  scrollPositionInstance,
  // buffer zone, the amount of placeholder heights to include
  buffer,
  // whether to use scroll compensation when elements above anchor change
  // set to 'positive' to only compensate for positive increase (useful when
  // combined with infinite scroll)
  scrollCompensation,
  // How to handle collapse/expansion (going from 0 elements to full and back)
  // - false - don't do scroll compensation at all
  // - 'height' - compensate scroll according to list's height
  // - 'item' - same as height but uses anchor element's top offset
  //   instead of whole height
  collapseMode,
  // Anchor. Set of IDs of element relative to which do scroll compensation
  anchorIds,
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
      const height = (() => {
        if (heights.value.has(id)) {
          return heights.value.get(id)
        } else {
          return getPlaceholderHeight(id).value
        }
      })()
      const suspendable = !unsuspendibleIds.value.has(id)
      const real = heights.value.has(id)
      return { id, height, suspendable, real }
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

  const { y: scrollY, scrollBy } = scrollPositionInstance
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
  const bufferZone = computed(
    () => getPlaceholderHeight().value * (toValue(buffer) ?? 3),
  )

  const checkVisible = ({ top, height }) => {
    const itemTopBoundary = top
    const itemBottomBoundary = top + height

    // Include buffer zone
    const finalTopScrollBoundary = topScrollBoundary.value - bufferZone.value
    const finalBottomScrollBoundary = bottomScrollBoundary.value + bufferZone.value

    // To be visible, item's bottom boundary shoud be below top scroll boundary)
    const isBelowTopBoundary = itemBottomBoundary > finalTopScrollBoundary
    // To be visible, item's top boundary shoud be above bottom scroll boundary)
    const isAboveBottomBoundary = itemTopBoundary < finalBottomScrollBoundary
    // This accounts for the case where item's boundaries exceed scroll boundary

    return isBelowTopBoundary && isAboveBottomBoundary
  }

  const heightChartVisibility = computed(() =>
    heightChart.value.map((heightChartItem) => ({
      ...heightChartItem,
      visible: checkVisible(heightChartItem),
    }))
  )

  // ## Scroll compensation
  watch(
    heightChart,
    async (newVal, oldVal) => {
      if (!toValue(scrollCompensation)) return
      if (newVal.length === 0 && oldVal.length === 0) return

      const diff = (() => {
        const expansion = oldVal.length === 0 && newVal.length !== 0
        const collapse = oldVal.length !== 0 && newVal.length === 0

        if (expansion) {
          if (toValue(collapseMode) === 'height') {
            const newBottomElement = last(newVal)

            return newBottomElement.top + newBottomElement.height
          } else if (toValue(collapseMode) === 'item') {
            const element = newVal.find(({ id }) => toValue(anchorIds).has(id))

            return element.top
          } else {
            return 0
          }
        } else if (collapse) {
          const oldBottomElement = last(oldVal)

          return 0 - oldBottomElement.top - oldBottomElement.height
        } else {
          console.log('COMPENSATE', oldVal, newVal, topScrollBoundary.value)
          const oldVisible = oldVal.filter((item) => checkVisible(item))
          const oldItem = first(oldVisible)
          const oldItemUpdated = newVal.find(({ id }) => id === oldItem.id)
          console.log('OLD', oldItem, oldItemUpdated)
          if (!oldItemUpdated) return 0 // context change?
          return oldItemUpdated.top - oldItem.top - (oldItem.height - oldItemUpdated.height)
        }
      })()

      if (diff !== 0) {
        console.log('DIFF', diff)
        // Scroll by amount offset changed to keep it in view
        topScrollBoundary.value += diff
        bottomScrollBoundary.value += diff
        await scrollBy(0, diff)
        await nextTick()
      }

      resumeWatchers()
    },
    { flush: 'post' }
  )

  const heightChartGrouped = computed(() =>
    // Group invisible items into spacers
    heightChartVisibility.value.reduce((acc, heightChartItem) => {
      const { suspendable, visible, height, top, bottom, id } =
        heightChartItem
      // Bottom value isn't really used otherwise for debugging
      const present = visible || !suspendable
      if (present) {
        return [...acc, { type: 'item', height, top, bottom, id }]
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
  )

  const reset = async () => {
    unsuspendibleIds.value = new Set()
    heights.value = new Map()
  }

  return {
    heightChart: heightChartGrouped,
    changeSuspendState,
    updateVirtualHeight,
    pauseWatchers,
    resumeWatchers,
    updateBoundaries,
    reset,
  }
}
