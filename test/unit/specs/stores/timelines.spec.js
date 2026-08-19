import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useStreamingStore } from 'src/stores/streaming.js'
import { useTimelinesStore } from 'src/stores/timelines.js'

describe('Timelines store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  afterEach(() => {
    useTimelinesStore().deactivateAll()
    vi.useRealTimers()
  })

  describe('activate', () => {
    it('streamable', () => {
      const store = useTimelinesStore()
      const sub = vi.fn()
      useStreamingStore().addSubscriber = sub

      console.log(store.activate)
      store.activate('friends', undefined, true)

      expect(sub).to.have.been.called
      expect(store.friends.fetcher).to.not.be.null
      expect(store.friends.socket).to.not.be.null
    })

    it('non-streamable', () => {
      const store = useTimelinesStore()
      const sub = vi.fn()
      useStreamingStore().addSubscriber = sub

      console.log(store.activate)
      store.activate('user', '1')

      expect(sub).to.not.have.been.called
      expect(store.user.fetcher).to.not.be.null
      expect(store.user.socket).to.be.null
    })
  })

  describe('deactivate', () => {
    it('streamable', () => {
      const store = useTimelinesStore()
      const unsub = vi.fn()
      useStreamingStore().removeSubscriber = unsub
      useStreamingStore().addSubscriber = vi.fn()

      store.activate('friends', undefined, true)
      // Checking so that they were set properly before
      // since reset changes them to ''
      store.friends.maxId = '3'
      store.friends.minId = '4'
      store.friends.statusIds = new Set(['3', '4'])
      store.friends.visibleStausIds = new Set(['3', '4'])
      store.deactivate('friends', true)

      expect(unsub).to.have.been.called
      expect(store.friends.fetcher).to.be.null
      expect(store.friends.socket).to.be.null
      expect(store.friends.statusIds).to.have.length(0)
      expect(store.friends.visibleStatusIds).to.have.length(0)
      expect(store.friends).to.have.property('maxId', '')
      expect(store.friends).to.have.property('minId', '')
    })

    it('non-streamable', () => {
      const store = useTimelinesStore()
      const unsub = vi.fn()
      useStreamingStore().removeSubscriber = unsub
      useStreamingStore().addSubscriber = vi.fn()

      store.activate('user', '1')
      // Checking so that they were set properly before
      // since reset changes them to ''
      store.user.maxId = '3'
      store.user.minId = '4'
      store.user.statusIds = new Set(['3', '4'])
      store.user.visibleStausIds = new Set(['3', '4'])
      store.deactivate('user')

      expect(unsub).to.not.have.been.called
      expect(store.user.fetcher).to.be.null
      expect(store.user.socket).to.be.null
      expect(store.user.statusIds).to.have.length(0)
      expect(store.user.visibleStatusIds).to.have.length(0)
      expect(store.user).to.have.property('maxId', '')
      expect(store.user).to.have.property('minId', '')
    })
  })

  describe('updateTimelineExtremes', () => {
    it('should derive extremes from data', () => {
      const store = useTimelinesStore()
      const timeline = useTimelinesStore().friends
      timeline.order = ['4', '1', '3', '2']
      timeline.statusesIds = new Set(timeline.order)
      store.updateTimelineExtremes(timeline)

      expect(store.friends).to.have.property('maxId', '4')
      expect(store.friends).to.have.property('minId', '2')
    })

    it('should use extremes from pagination', () => {
      const store = useTimelinesStore()
      const timeline = useTimelinesStore().friends
      store.updateTimelineExtremes(timeline, { maxId: '1', minId: '2' })

      // Min and max are swapped!
      expect(store.friends).to.have.property('maxId', '2')
      expect(store.friends).to.have.property('minId', '1')
    })
  })

  describe('addStatusesToTimeline', () => {
    it('adds the status to the given timeline', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.list.order).to.eql(statuses)
      expect(store.list.statusIds).to.eql(new Set(statuses))
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(3)
      expect(store.list).to.have.property('maxId', '1')
      expect(store.list).to.have.property('minId', '3')
    })

    it('ignores duplicates', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses,
        pagination: { minId: '1', maxId: '3' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.list.order).to.eql(statuses)
      expect(store.list.statusIds).to.eql(new Set(statuses))
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(3)
      expect(store.list).to.have.property('maxId', '1')
      expect(store.list).to.have.property('minId', '3')
    })

    it('adds the status the given timeline, directly visible', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses,
        showImmediately: true,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.list.order).to.eql(statuses)
      expect(store.list.statusIds).to.eql(new Set(statuses))
      expect(store.list.visibleStatusIds).to.eql(new Set(statuses))
      expect(store.list.newStatusCount).to.equal(0)
      expect(store.list).to.have.property('maxId', '1')
      expect(store.list).to.have.property('minId', '3')
    })

    it('does not update the maxId when the noIdUpdate flag is set', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses,
        noIdUpdate: true,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.list.order).to.eql(statuses)
      expect(store.list.statusIds).to.eql(new Set(statuses))
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(3)
      expect(store.list).to.have.property('maxId', '')
      expect(store.list).to.have.property('minId', '')
    })

    it('does not update timeline if it belongs to a different arugment', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '2', {
        statuses,
        noIdUpdate: true,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.list.order).to.eql([])
      expect(store.list.statusIds).to.eql(new Set())
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(0)
      expect(store.list).to.have.property('maxId', '')
      expect(store.list).to.have.property('minId', '')
    })

    it('prepends timeline with new statuses', () => {
      const store = useTimelinesStore()
      const statuses1 = ['3', '2', '1']
      const statuses2 = ['6', '5', '4']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses1,
        pagination: { minId: '3', maxId: '1' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses2,
        pagination: { minId: '6', maxId: '4' },
      })

      const newOrder = [...statuses2, ...statuses1]
      expect(store.list.order).to.eql(newOrder)
      expect(store.list.statusIds).to.eql(new Set(newOrder))
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(6)
      expect(store.list).to.have.property('maxId', '6')
      expect(store.list).to.have.property('minId', '1')
    })

    it('appends timeline with new statuses if fetching older', () => {
      const store = useTimelinesStore()
      const statuses1 = ['6', '5', '4']
      const statuses2 = ['3', '2', '1']

      store.activate('list', '1')
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses1,
        pagination: { minId: '6', maxId: '4' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses2,
        pagination: { minId: '3', maxId: '1' },
        older: true,
      })

      const newOrder = [...statuses1, ...statuses2]
      expect(store.list.order).to.eql(newOrder)
      expect(store.list.statusIds).to.eql(new Set(newOrder))
      expect(store.list.visibleStatusIds).to.eql(new Set())
      expect(store.list.newStatusCount).to.equal(6)
      expect(store.list).to.have.property('maxId', '6')
      expect(store.list).to.have.property('minId', '1')
    })
  })

  describe('showNewStatuses', () => {
    it('resets counter and makes all ids visible', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('public')
      store.addStatusesToTimeline('public', undefined, {
        statuses,
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.public.statusIds).to.eql(new Set(statuses))
      expect(store.public.visibleStatusIds).to.eql(new Set())
      expect(store.public.newStatusCount).to.equal(3)
      store.showNewStatuses('public')
      expect(store.public.visibleStatusIds).to.eql(new Set(statuses))
      expect(store.public.newStatusCount).to.equal(0)
    })
  })

  describe('wipeStatuses', () => {
    it('clears all statuses', () => {
      const store = useTimelinesStore()

      store.activate('friends')
      store.activate('public')
      store.addStatusesToTimeline('public', undefined, {
        statuses: ['1', '2', '3', '0'],
      })
      store.addStatusesToTimeline('friends', undefined, {
        statuses: ['5', '0', '9', '1'],
      })
      store.wipeStatuses(['0'])
      expect(store.friends.statusIds).to.not.have.members('0')
      expect(store.public.statusIds).to.not.have.members('0')
    })
  })
})
