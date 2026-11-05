import { createPinia, setActivePinia } from 'pinia'

import { useNotificationsStore } from 'src/stores/notifications.js'

import { markNotificationsAsSeen } from 'src/api/user.js'

vi.mock('src/api/user.js', async (importOriginal) => ({
  ...(await importOriginal()),
  markNotificationsAsSeen: vi.fn(),
}))

const note = (id, type, seen = false) => ({ id, type, seen })

const setup = (data) => {
  const store = useNotificationsStore()
  store.data = data
  data.forEach((n) => store.idStore.set(n.id, n))
  return store
}

const calls = () =>
  markNotificationsAsSeen.mock.calls.map(([{ id, single }]) =>
    single ? `id ${id}` : `max ${id}`,
  )

describe('Notifications store, requests for read ones', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    markNotificationsAsSeen.mockResolvedValue({})
  })

  it('sends nothing for a single notification that is already read', () => {
    const store = setup([note('8', 'mention', true)])
    store.markSingleNotificationAsSeen('8')
    store.markSingleNotificationAsSeen('8')
    expect(calls()).to.eql([])
  })

  it('sends one request when a single unread one gets many clicks', () => {
    const store = setup([note('8', 'mention')])
    store.markSingleNotificationAsSeen('8')
    store.markSingleNotificationAsSeen('8')
    expect(calls()).to.eql(['id 8'])
  })

  it('sends nothing for read all when all are already read', () => {
    const store = setup([note('8', 'like', true), note('5', 'like', true)])
    store.markNotificationsAsSeen()
    expect(calls()).to.eql([])
  })
})
