import { first, last } from 'lodash-es'
import { computed, nextTick, ref, toValue, watch } from 'vue'

import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling({
  // For debugging
  name = 'Generic',
  // Master toggle
  enabled,
  // List of items
  list,
  // Container of items, used for measuring scroll position
  body,
  // vertical offset to account for fixed and sticky headers
  offset,
  // useScrollPosition composable, used to prevent dupicating instances
  scrollPositionInstance,
  // buffer zone, the amount of placeholder heights to include
  buffer,
  // whether to use scroll compensation when elements above anchor change
  scrollCompensation,
  // How to handle collapse/expansion (going from 0 elements to full and back)
  // - false - don't do scroll compensation at all
  // - 'height' - compensate scroll according to list's height
  // - 'item' - same as height but uses anchor element's top offset
  //   instead of whole height
  collapseMode,
  // Placeholder height specification. Must be a function.
  // function will be called either:
  // - without arguments (for generic placeholder, i.e. buffer zone size)
  // - with id (for specific item placeholders)
  // function must return ref pointing to height
  getPlaceholderHeight,
}) {
  // # Suspension
  const unsuspendibleIds = ref(new Set())
  const changeSuspendState = ({ id, suspendable }) => {
    if (suspendable) {
      unsuspendibleIds.value.delete(id)
    } else {
      unsuspendibleIds.value.add(id)
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
      return { id, height, suspendable, real, visible: true }
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
    if (!toValue(enabled)) return
    if (!body.value) return // Not mounted yet

    const { top } = body.value.getBoundingClientRect()

    const distanceItemTopToWindowTop = 0 - top + (toValue(offset) ?? 0)
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

  watch(enabled, (val) => {
    if (val) {
      resumeWatchers()
    } else {
      pauseWatchers()
    }
  })

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
    const finalBottomScrollBoundary =
      bottomScrollBoundary.value + bufferZone.value

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
    })),
  )
  const heightChartGrouped = computed(() => {
    const chart = enabled.value ? heightChartVisibility : heightChart
    // Group invisible items into spacers
    return chart.value.reduce((acc, heightChartItem) => {
      const { suspendable, visible, height, top, id } = heightChartItem
      const present = visible || !suspendable
      if (present) {
        return [...acc, { type: 'item', height, top, id }]
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
              height: 0,
              ids: new Set(),
            }

        spacer.ids.add(id)
        spacer.id = [...spacer.ids].join() // used for v-for key attribute
        spacer.height += height

        if (top < spacer.top) spacer.top = top

        // If we used previous item there is no need to push it to array
        if (usingPreviousItem) {
          return acc
        } else {
          return [...acc, spacer]
        }
      }
    }, [])
  })

  // ## Scroll compensation
  watch(
    heightChart,
    async (newVal, oldVal) => {
      if (!toValue(scrollCompensation)) return
      if (newVal.length === 0 && oldVal.length === 0) return
      const explosion = oldVal.length === 0 && newVal.length !== 0
      const implosion = oldVal.length !== 0 && newVal.length === 0

      const diff = (() => {
        if (explosion) {
          if (toValue(collapseMode) === 'height') {
            const newBottomElement = last(newVal)

            return newBottomElement.top + newBottomElement.height
          } else {
            return 0
          }
        } else if (implosion) {
          const oldBottomElement = last(oldVal)

          return 0 - oldBottomElement.top - oldBottomElement.height
        } else {
          const contextChange = (() => {
            const oldIds = new Set(oldVal.map(({ id }) => id))
            const newIds = new Set(newVal.map(({ id }) => id))

            if (oldVal.length <= newVal.length) {
              return [...oldIds].some((id) => !newIds.has(id))
            } else {
              return [...newIds].some((id) => !oldIds.has(id))
            }
          })()
          if (contextChange) return 0

          const expansion = (() => {
            if (newVal.length < oldVal.length) return 0
            const oldVisible = oldVal.filter(
              (item) => checkVisible(item) && item.real,
            )
            const oldItem = first(oldVisible)
            if (!oldItem) return 0 // probably out of bounds in timeline
            const oldItemUpdated = newVal.find(({ id }) => id === oldItem.id)

            return (
              oldItemUpdated.top -
              oldItem.top -
              (oldItem.height - oldItemUpdated.height)
            )
          })()

          const collapsing = (() => {
            if (newVal.length >= oldVal.length) return 0
            const newVisible = newVal
            const newItem = first(newVisible)
            if (!newItem) return 0 // probably out of bounds in timeline
            const newItemBefore = oldVal.find(({ id }) => id === newItem.id)

            return (
              newItem.top -
              newItemBefore.top -
              (newItemBefore.height - newItem.height)
            )
          })()

          return expansion + collapsing
        }
      })()

      if (diff !== 0) {
        // Scroll by amount offset changed to keep it in view
        topScrollBoundary.value += diff
        bottomScrollBoundary.value += diff
        await scrollBy(0, diff)
        await nextTick()
      }

      resumeWatchers()
    },
    { flush: 'post' },
  )

  // Misc
  const reset = () => {
    unsuspendibleIds.value = new Set()
    heights.value = new Map()
  }

  const scrollTo = (anchors) => {
    pauseWatchers()

    const element = heightChart.value.find(({ id }) => anchors.has(id))
    if (!element) {
      console.error(`No element with id matching ${[...anchors].join()} found`)
      return
    }
    const elementMiddle = element.top + element.height / 2
    const desiredTopBoundary = Math.min(
      element.top,
      elementMiddle - (windowHeight.value - offset.value) / 2,
    )

    scrollBy(0, desiredTopBoundary - topScrollBoundary.value)

    resumeWatchers()
  }

  return {
    heightChart: heightChartGrouped,
    changeSuspendState,
    updateVirtualHeight,
    pauseWatchers,
    resumeWatchers,
    updateBoundaries,
    reset,
    scrollTo,
  }
}
