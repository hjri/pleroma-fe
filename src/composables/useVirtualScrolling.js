import { first, last, throttle } from 'lodash-es'
import { computed, nextTick, ref, toValue, watch } from 'vue'

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
  // Invert grow direction. Useful for chat views. Makes scroll compensation
  // work in reverse - adding items to bottom scrolls down, adding items to
  // top doesn't scroll up.
  invertDirection = false,
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

  const {
    top: scrollY,
    scrollBy,
    vHeight,
    hasReachedTop,
    hasReachedBottom,
  } = scrollPositionInstance

  // Real scroll boundary, relative to body's bounds
  const topScrollBoundary = ref(0)
  const bottomScrollBoundary = ref(0)

  const updateBoundaries = () => {
    if (!toValue(enabled)) return
    if (!body.value) return // Not mounted yet

    const { top } = body.value.getBoundingClientRect()

    const distanceItemTopToWindowTop = 0 - top + (toValue(offset) ?? 0)
    const distanceItemTopToWindowBottom = vHeight.value - top

    // Technically, bottom scroll boundary should be distance
    // from element's top border to window's bottom border,
    // but it just so happens that it is equal to this.
    // You can verify it by drawing the boxes and measuring
    // distances yourself, I know I did. Geometry, man...
    topScrollBoundary.value = distanceItemTopToWindowTop
    bottomScrollBoundary.value = distanceItemTopToWindowBottom
  }

  const windowWatcher = watch(vHeight, updateBoundaries)
  const scrollWatcher = watch(scrollY, updateBoundaries)
  const heightWatcher = watch(heightChart, updateBoundaries)
  const bodyWatcher = watch(body, updateBoundaries)

  watch(vHeight, (neu, old) => {
    if (toValue(invertDirection)) {
      // Only compensate (stick to bottom) when shrinking
      scrollBy(0, Math.max(old - neu, 0))
      // compensating in other direction causes overscrolling
    }
  })

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
  // Add buffer zone to boundary, equal to approx 10 items heights
  const bufferZone = computed(
    () => getPlaceholderHeight().value * (toValue(buffer) ?? 5),
  )

  // Stuff that's on screen
  const checkVisible = ({ top, height }) => {
    const itemTopBoundary = top
    const itemBottomBoundary = top + height

    // Include buffer zone
    const finalTopScrollBoundary = topScrollBoundary.value
    const finalBottomScrollBoundary = bottomScrollBoundary.value

    // To be visible, item's bottom boundary shoud be below top scroll boundary)
    const isBelowTopBoundary = itemBottomBoundary > finalTopScrollBoundary
    // To be visible, item's top boundary shoud be above bottom scroll boundary)
    const isAboveBottomBoundary = itemTopBoundary < finalBottomScrollBoundary
    // This accounts for the case where item's boundaries exceed scroll boundary

    return isBelowTopBoundary && isAboveBottomBoundary
  }

  // Same thing but including buffer zone
  const checkRendered = ({ top, height }) => {
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

  const heightChartVisibility = ref(null)

  const recalculateChartVisibility = throttle(
    (newVal, oldVal) => {
      heightChartVisibility.value = heightChart.value.map(
        (heightChartItem) => ({
          ...heightChartItem,
          visible: checkVisible(heightChartItem),
          rendered: checkRendered(heightChartItem),
        }),
      )
    },
    32, // 32ms = ~30fps
    { leading: true, trailing: true },
  )
  watch(
    [heightChart, topScrollBoundary, bottomScrollBoundary, bufferZone],
    recalculateChartVisibility,
    { immediate: true },
  )

  const heightChartGrouped = computed(() => {
    const chart = heightChartVisibility
    // Group invisible items into spacers
    return chart.value.reduce((acc, heightChartItem, index) => {
      const { suspendable, rendered, visible, height, top, id } =
        heightChartItem
      const present = rendered || !suspendable || !enabled.value
      if (present) {
        return [
          ...acc,
          { type: 'item', height, top, id, visible, rendered, present },
        ]
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
              id: `i${index}`, // used for v-for key attribute
              ids: new Set(),
            }

        spacer.ids.add(id)
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
    heightChartVisibility,
    async (newVal, oldVal) => {
      if (newVal.length === 0 && oldVal.length === 0) return 0
      const explosion = oldVal.length === 0 && newVal.length !== 0
      const implosion = oldVal.length !== 0 && newVal.length === 0

      const compensation = toValue(scrollCompensation)
      const diff = (() => {
        if (explosion) {
          if (!compensation) return 0
          if (toValue(collapseMode) === 'height' || toValue(invertDirection)) {
            const newBottomElement = last(newVal)

            return newBottomElement.top + newBottomElement.height
          } else {
            return 0
          }
        } else if (implosion) {
          if (!compensation) return 0
          const oldBottomElement = last(oldVal)

          return 0 - oldBottomElement.top - oldBottomElement.height
        } else {
          const contextChange = (() => {
            // HACK ignore date separators and fake messages in chat view
            const oldIds = new Set(
              oldVal
                .map(({ id }) => id)
                .filter((id) => !id.startsWith('fake-')),
            )
            const newIds = new Set(
              newVal
                .map(({ id }) => id)
                .filter((id) => !id.startsWith('fake-')),
            )

            if (oldVal.length <= newVal.length) {
              return [...oldIds].some((id) => !newIds.has(id))
            } else {
              return [...newIds].some((id) => !oldIds.has(id))
            }
          })()
          if (contextChange) {
            return 0
          }

          const isSticking = toValue(invertDirection)
            ? hasReachedBottom.value
            : hasReachedTop.value
          if (!compensation) {
            return 0
          }

          // Section is used for debugging only
          const getShift = (section, a, b, find, getter) => {
            const aItem = find(a)
            if (!aItem) return 0
            const bItem = b.find(({ id }) => id === aItem.id)
            if (!bItem) return 0
            return getter(bItem) - getter(aItem)
          }

          const expansion = (() => {
            if (newVal.length < oldVal.length) return 0
            return getShift(
              'expansion',
              oldVal,
              newVal,
              (list) =>
                list.find(
                  ({ top, height }) => top + height < topScrollBoundary.value,
                ) ?? first(list),
              ({ top, height }) => top + height,
            )
          })()

          const inverseCompensation = (() => {
            if (!toValue(invertDirection)) return 0
            if (newVal.length < oldVal.length) return 0
            const shift = getShift(
              'inverse',
              oldVal,
              newVal,
              (list) =>
                list.findLast(({ top }) => top > bottomScrollBoundary.value) ??
                last(list),
              ({ top }) => top,
            )
            if (isSticking) {
              // Don't do 99999 here, it breaks virtual scrolling
              const { height } = body.value.getBoundingClientRect()
              return height // keep sticking
            } else {
              return shift
            }
          })()

          const collapsing = (() => {
            if (newVal.length >= oldVal.length) return 0
            return -getShift(
              'collapse',
              newVal,
              oldVal,
              (list) => first(list),
              ({ top, height }) => top + height,
            )
          })()

          return (
            (toValue(invertDirection) ? inverseCompensation : expansion) +
            collapsing
          )
        }
      })()

      if (diff !== 0) {
        // Scroll by amount offset changed to keep it in view
        topScrollBoundary.value += diff
        bottomScrollBoundary.value += diff
        await nextTick()
        await scrollBy(0, diff)
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

  return {
    heightChart: heightChartGrouped,
    heightChartFull: heightChartVisibility,
    changeSuspendState,
    updateVirtualHeight,
    pauseWatchers,
    resumeWatchers,
    updateBoundaries,
    reset,
  }
}
