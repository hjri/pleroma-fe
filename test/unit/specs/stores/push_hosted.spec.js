import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'

import { registerPushNotifications } from 'src/services/sw/sw.js'

vi.mock('src/services/sw/sw.js', async (importOriginal) => ({
  ...(await importOriginal()),
  registerPushNotifications: vi.fn(),
}))

// The service worker would fetch pushed notifications from this site, not
// from the instance: no web push on the hosted site (yet).
describe('web push on the hosted site', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    registerPushNotifications.mockClear()
  })

  it('does not subscribe', () => {
    useInstanceStore().hosted = true
    useInterfaceStore().registerPushNotifications()
    expect(registerPushNotifications).not.toHaveBeenCalled()
  })

  it('subscribes on an instance as before', () => {
    useInstanceStore().hosted = false
    useInterfaceStore().registerPushNotifications()
    expect(registerPushNotifications).toHaveBeenCalled()
  })
})
