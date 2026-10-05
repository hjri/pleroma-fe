import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { ref } from 'vue'

import { useVirtualScrolling } from 'src/composables/useVirtualScrolling.js'

const scrollPositionInstance = {
  x: ref(0),
  y: ref(0),
  vHeight: ref(768),
  vWidth: ref(1024),
  cHeight: ref(768),
  cWidth: ref(1024),
  scrollBy: vi.fn(),
  hasReachedTop: ref(false),
  hasReachedBottom: ref(false),
}

describe('useVirtualScrolling', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
    scrollPositionInstance.x.value = 0
    scrollPositionInstance.y.value = 0
  })

  it('should init boundaries and compute a height chart', async () => {
    const body = ref({
      getBoundingClientRect: () => ({
        top: 0,
      }),
    })
    const list = [...new Array(20)].map((i, index) => ({
      id: `${index}i`,
    }))
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list: ref(list),
      body: ref(body),
      buffer: 3,
      offset: 0,
      getPlaceholderHeight: () => ref(100),
      scrollPositionInstance,
    })

    result.updateBoundaries()
    const items = [...new Array(11)].map((i, index) => ({
      id: `${index}i`,
      top: index * 100,
      height: 100,
      type: 'item',
    }))
    const spacer = {
      type: 'spacer',
      top: 1100,
      height: 900,
      ids: expect.any(Set),
      id: 'i11',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([...items, spacer])
  })

  it('should update a height chart on list update', async () => {
    const body = ref({
      getBoundingClientRect: () => ({
        top: 0,
      }),
    })
    const list = ref([...new Array(40)].map((i, index) => ({
      id: `${index}i`,
    })))
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list,
      body: ref(body),
      offset: 0,
      getPlaceholderHeight: () => ref(100),
      scrollPositionInstance,
    })

    result.updateBoundaries()
    const items = [...new Array(18)].map((i, index) => ({
      id: `${index}i`,
      top: index * 100,
      height: 100,
      type: 'item',
    }))
    const spacerOld = {
      type: 'spacer',
      top: 1800,
      height: 2200,
      ids: expect.any(Set),
      id: 'i18',
    }
    const spacerNew = {
      type: 'spacer',
      top: 1800,
      height: 2300,
      ids: expect.any(Set),
      id: 'i18',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([...items, spacerOld])
    list.value.push({ id: 'new' })
    await vi.advanceTimersByTime(32)
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([...items, spacerNew])
  })

  it('should update boundaries and compute a height chart on scroll', async () => {
    let topPosition = 0
    const body = ref({
      getBoundingClientRect: () => ({
        top: topPosition,
      }),
    })
    const list = [...new Array(20)].map((i, index) => ({
      id: `${index}i`,
    }))
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list: ref(list),
      body: ref(body),
      buffer: 3,
      offset: 0,
      getPlaceholderHeight: () => ref(100),
      scrollPositionInstance,
    })
    result.updateBoundaries()

    const amount = 500
    topPosition -= amount
    result.updateBoundaries()

    const spacer1 = {
      type: 'spacer',
      top: 0,
      height: 200,
      ids: expect.any(Set),
      id: 'i0',
    }
    const items = [...new Array(14)].map((i, index) => ({
      id: `${index + 2}i`,
      top: (index + 2) * 100,
      height: 100,
      type: 'item',
    }))
    const spacer2 = {
      type: 'spacer',
      top: 1600,
      height: 400,
      ids: expect.any(Set),
      id: 'i16',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([spacer1, ...items, spacer2])
  })

  it('should compensate for scroll when new items added on top', async () => {
    let topPosition = 0
    const body = ref({
      getBoundingClientRect: () => ({
        top: topPosition,
      }),
    })
    const listOld = [...new Array(10)].map((i, index) => ({
      id: `${index}ia`,
    }))
    const listNew = [...new Array(10)].map((i, index) => ({
      id: `${index}ib`,
    }))
    const list = ref(listOld)
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list,
      body: ref(body),
      offset: 0,
      buffer: 3,
      getPlaceholderHeight: () => ref(100),
      scrollCompensation: true,
      scrollPositionInstance,
    })
    listOld.forEach((i) => {
      result.updateVirtualHeight({ id: i.id, height: 200 })
    })
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()

    list.value = [...listNew, ...listOld]
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()
    const amount = 1000
    expect(scrollPositionInstance.scrollBy).to.have.been.calledWith(0, amount)
    topPosition -= amount
    result.updateBoundaries()

    const spacer1 = {
      type: 'spacer',
      top: 0,
      height: 700,
      ids: expect.any(Set),
      id: 'i0',
    }
    const itemsNew = [...new Array(3)].map((i, index) => ({
      id: `${index + 7}ib`,
      top: (index + 7) * 100,
      height: 100,
      type: 'item',
    }))
    const itemsOld = [...new Array(6)].map((i, index) => ({
      id: `${index}ia`,
      top: index * 200 + 1000,
      height: 200,
      type: 'item',
    }))
    const spacer2 = {
      type: 'spacer',
      top: 2200,
      height: 800,
      ids: expect.any(Set),
      id: 'i16',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([
      spacer1,
      ...itemsNew,
      ...itemsOld,
      spacer2,
    ])
  })

  it('should compensate for scroll when items are removed from top', async () => {
    let topPosition = 0
    const body = ref({
      getBoundingClientRect: () => ({
        top: topPosition,
      }),
    })
    const listA = [...new Array(10)].map((i, index) => ({
      id: `${index}ia`,
    }))
    const listB = [...new Array(10)].map((i, index) => ({
      id: `${index}ib`,
    }))
    const listC = [...new Array(10)].map((i, index) => ({
      id: `${index}ic`,
    }))
    const list = ref([...listA, ...listB, ...listC])
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list,
      body: ref(body),
      offset: 0,
      buffer: 3,
      getPlaceholderHeight: () => ref(100),
      scrollCompensation: true,
      scrollPositionInstance,
    })
    list.value.forEach((i) => {
      result.updateVirtualHeight({ id: i.id, height: 200 })
    })
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()

    list.value = listB
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()
    const amount = -2000
    expect(scrollPositionInstance.scrollBy).to.have.been.calledWith(0, amount)
    // topPosition -= amount // not doing this because it would overscroll
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()

    const items = [...new Array(6)].map((i, index) => ({
      id: `${index}ib`,
      top: index * 200,
      height: 200,
      type: 'item',
    }))
    const spacer = {
      type: 'spacer',
      top: 1200,
      height: 800,
      ids: expect.any(Set),
      id: 'i6',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([...items, spacer])
  })

  it('should exclude unsuspendable items from virtualization', async () => {
    let topPosition = 0
    const body = ref({
      getBoundingClientRect: () => ({
        top: topPosition,
      }),
    })
    const list = ref(
      [...new Array(20)].map((i, index) => ({
        id: `${index}i`,
      })),
    )
    const result = useVirtualScrolling({
      name: 'Test',
      enabled: ref(true),
      list,
      body: ref(body),
      offset: 0,
      buffer: 3,
      getPlaceholderHeight: () => ref(100),
      scrollPositionInstance,
    })
    list.value.forEach((i) => {
      result.updateVirtualHeight({ id: i.id, height: 200 })
    })
    result.changeSuspendState({ id: '2i', suspendable: false })
    result.changeSuspendState({ id: '3i', suspendable: true })
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()

    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()
    const amount = 2000
    topPosition -= amount
    result.updateBoundaries()
    await vi.advanceTimersToNextTimerAsync()

    const spacer1 = {
      type: 'spacer',
      top: 0,
      height: 400,
      ids: expect.any(Set),
      id: 'i0',
    }
    const items1 = [
      {
        id: `2i`,
        top: 400,
        height: 200,
        type: 'item',
      },
    ]
    const spacer2 = {
      type: 'spacer',
      top: 600,
      height: 1000,
      ids: expect.any(Set),
      id: 'i3',
    }
    const items2 = [...new Array(8)].map((i, index) => ({
      id: `${index + 8}i`,
      top: (index + 8) * 200,
      height: 200,
      type: 'item',
    }))
    const spacer3 = {
      type: 'spacer',
      top: 3200,
      height: 800,
      ids: expect.any(Set),
      id: 'i16',
    }
    await vi.advanceTimersByTime(32)
    expect(result.heightChart.value).toEqual([
      spacer1,
      ...items1,
      spacer2,
      ...items2,
      spacer3,
    ])
  })
})
