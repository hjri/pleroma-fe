import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useInstanceStore } from 'src/stores/instance.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useStreamingStore } from 'src/stores/streaming.js'

import { WSConnectionStatus } from 'src/api/websocket.js'

// A server that refuses sockets from this site (Pleroma's origin check, for
// a hosted frontend): the socket closes before it ever opens. The app
// stops asking after a few tries and keeps polling, without notices.
describe('streaming a server refuses', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    vi.useFakeTimers({ toFake: ['setTimeout'] })
  })
  afterEach(() => vi.useRealTimers())

  const refused = { data: { code: 1006 } }

  it('stops retrying after three sockets that never opened', async () => {
    useInstanceStore().hosted = true
    const streaming = useStreamingStore()
    const initSocket = vi
      .spyOn(streaming, 'initSocket')
      .mockReturnValue(undefined)
    for (let i = 0; i < 3; i++) {
      streaming.onClose(refused)
      await vi.runAllTimersAsync()
    }
    expect(initSocket).toHaveBeenCalledTimes(2)
    expect(streaming.state).to.equal(WSConnectionStatus.DISABLED)
    expect(streaming.retrying).to.equal(false)
  })

  it('keeps retrying a socket that did open before (a server restart)', async () => {
    const streaming = useStreamingStore()
    const initSocket = vi
      .spyOn(streaming, 'initSocket')
      .mockReturnValue(undefined)
    streaming.onOpen()
    for (let i = 0; i < 4; i++) {
      streaming.onClose(refused)
      await vi.runAllTimersAsync()
    }
    expect(initSocket).toHaveBeenCalledTimes(4)
    expect(streaming.state).to.not.equal(WSConnectionStatus.DISABLED)
  })

  // an instance serving the page may just be restarting at page load
  it('keeps retrying on an instance', async () => {
    const streaming = useStreamingStore()
    const initSocket = vi
      .spyOn(streaming, 'initSocket')
      .mockReturnValue(undefined)
    for (let i = 0; i < 4; i++) {
      streaming.onClose(refused)
      await vi.runAllTimersAsync()
    }
    expect(initSocket).toHaveBeenCalledTimes(4)
    expect(streaming.state).to.not.equal(WSConnectionStatus.DISABLED)
  })

  it('shows no "socket broke" notice for a socket that never opened', () => {
    useInstanceStore().hosted = true
    const ui = useInterfaceStore()
    const push = vi.spyOn(ui, 'pushGlobalNotice')
    ui.onStreamDisconnect({ original: { code: 1006 } })
    expect(push).not.toHaveBeenCalled()
    useStreamingStore().onOpen()
    ui.onStreamDisconnect({ original: { code: 1006 } })
    expect(push).toHaveBeenCalled()
  })

  // an instance serving the page may just be restarting: say so, as before
  it('shows the notice on an instance even before a socket opened', () => {
    const ui = useInterfaceStore()
    const push = vi.spyOn(ui, 'pushGlobalNotice')
    ui.onStreamDisconnect({ original: { code: 1006 } })
    expect(push).toHaveBeenCalled()
  })
})
