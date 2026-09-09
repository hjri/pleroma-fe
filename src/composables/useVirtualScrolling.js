import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'

import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useStatusesStore } from 'src/stores/statuses.js'

import { useScrollPosition } from 'src/composables/useScrollPosition.js'
import { useWindowSize } from 'src/composables/useWindowSize.js'

export function useVirtualScrolling(conversation, body) {
  const getStatusObject = (id) => useStatusesStore().allStatuses.get(id)

  const { mergedConfig } = storeToRefs(useMergedConfigStore())

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
  watch(fontSizeSetting, updateFontSize)

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
  const { y: topScrollBoundary } = useScrollPosition()
  const { height: windowHeight } = useWindowSize()

  const realTopScrollBoundary = ref(0)
  const realBottomScrollBoundary = ref(0)
  const updateBoundaries = () => {
    if (!body.value) return // Not mounted yet

    const { top } = body.value.getBoundingClientRect()

    const distanceItemTopToWindowTop = 0 - top
    const distanceItemTopToWindowBottom = windowHeight.value - top

    realTopScrollBoundary.value = distanceItemTopToWindowTop
    realBottomScrollBoundary.value = distanceItemTopToWindowBottom
  }
  watch(windowHeight, updateBoundaries)
  watch(topScrollBoundary, updateBoundaries)
  watch(totalHeight, updateBoundaries)
  onMounted(updateBoundaries)

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

    // Determine visibility state
    chart.forEach((heightChartItem) => {
      const itemBottomBoundary = heightChartItem.top + heightChartItem.height
      const itemTopBoundary = heightChartItem.top

      const finalTopScrollBoundary = realTopScrollBoundary.value - buffer.value
      const finalBottomScrollBoundary =
        realBottomScrollBoundary.value + buffer.value

      // To be visible, item's bottom boundary shoud be below top scroll boundary)
      const belowTopBoundary = itemBottomBoundary > finalTopScrollBoundary
      // To be visible, item's top boundary shoud be above bottom scroll boundary)
      const aboveBottomBoundary = itemTopBoundary < finalBottomScrollBoundary
      // This accounts for the case where item's boundaries exceed scroll boundary

      heightChartItem.visible = belowTopBoundary && aboveBottomBoundary
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
    heightChart,
    changeSuspendState,
    updateVirtualHeight,
  }
}
