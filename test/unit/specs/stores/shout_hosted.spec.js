import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useShoutStore } from 'src/stores/shout.js'
import { useUsersStore } from 'src/stores/users.js'

// Pleroma refuses sockets from other sites: no endless reconnecting
describe('shoutbox on the hosted site', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    useUsersStore().currentUser = { token: 'token' }
    useInstanceCapabilitiesStore().shoutAvailable = true
    useInstanceStore().hosted = true
  })

  it('opens no socket and joins nothing', () => {
    const store = useShoutStore()
    store.initializeSocket()
    store.initializeShout()
    expect(store.socket).to.equal(null)
    expect(store.joined).to.equal(false)
  })
})
