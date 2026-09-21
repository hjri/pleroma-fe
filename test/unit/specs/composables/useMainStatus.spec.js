import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useStatusesStore } from 'src/stores/statuses.js'

import { useMainStatus } from 'src/composables/useMainStatus.js'

describe('useMainStatus', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia())
    useStatusesStore().allStatuses = new Map([
      [1, { id: 1 }],
      [2, { id: 2, retweeted_status: { id: 1 } }],
    ])
  })

  it('non-repeat', () => {
    const { status, mainStatus } = useMainStatus(1)

    expect(status.value).to.eql({ id: 1 })
    expect(mainStatus.value).to.eql({ id: 1 })
  })

  it('repeat', () => {
    const { status, mainStatus } = useMainStatus(2)

    expect(status.value).to.eql({ id: 2, retweeted_status: { id: 1 } })
    expect(mainStatus.value).to.eql({ id: 1 })
  })
})
