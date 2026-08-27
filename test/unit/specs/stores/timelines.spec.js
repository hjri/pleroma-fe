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

      store.activate('friends', undefined, true)

      expect(sub).to.have.been.called
      expect(store.friends.fetcher).to.not.be.null
      expect(store.friends.socket).to.not.be.null
    })

    it('non-streamable', () => {
      const store = useTimelinesStore()
      const sub = vi.fn()
      useStreamingStore().addSubscriber = sub

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
        repeats: [],
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
        repeats: [],
        pagination: { minId: '1', maxId: '3' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses,
        repeats: [],
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
        repeats: [],
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
        repeats: [],
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
        repeats: [],
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
        repeats: [],
        pagination: { minId: '3', maxId: '1' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses2,
        repeats: [],
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
        repeats: [],
        pagination: { minId: '6', maxId: '4' },
      })
      store.addStatusesToTimeline('list', '1', {
        statuses: statuses2,
        repeats: [],
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

    describe('repeat de-duplication', () => {
      it('handles repeat de-duplication (older)', () => {
        const store = useTimelinesStore()
        const statuses1 = ['s7s3', 's6s3', 's5', 's4s0', 's3', 's2']
        const statuses2 = ['s1s0', 's0']

        store.activate('list', '1')
        store.addStatusesToTimeline('list', '1', {
          statuses: statuses1,
          repeats: [
            ['s7s3', 's2'],
            ['s6s3', 's2'],
            ['s4s0', 's0'],
          ],
          pagination: { minId: 's7s3', maxId: 's2' },
          showImmediately: true,
        })
        expect(store.list.order).to.eql(statuses1)
        expect(store.list.statusIds).to.eql(new Set(statuses1))
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's5',
          's4s0',
          's3',
          's2',
        ]))
        expect(store.list).to.have.property('maxId', 's7s3')
        expect(store.list).to.have.property('minId', 's2')

        store.addStatusesToTimeline('list', '1', {
          statuses: statuses2,
          repeats: [
            ['s1s0', 's0'],
          ],
          pagination: { minId: 's1', maxId: 's0' },
          showImmediately: true,
          older: true
        })

        const newOrder = [...statuses1, ...statuses2]
        expect(store.list.order).to.eql(newOrder)
        expect(store.list.statusIds).to.eql(new Set(newOrder))
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's5',
          's4s0',
          's3',
          's2',
          's0',
        ]))
        expect(store.list).to.have.property('maxId', 's7s3')
        expect(store.list).to.have.property('minId', 's0')
      })

      it('handles repeat de-duplication(reverse)', () => {
        const store = useTimelinesStore()
        const statuses1 = ['s6s2', 's5s2', 's4', 's3s0', 's2', 's1']
        const statuses2 = ['sAs0', 's9s1', 's8', 's7s2']

        store.activate('list', '1')
        store.addStatusesToTimeline('list', '1', {
          statuses: statuses1,
          repeats: [
            ['s6s2', 's2'],
            ['s5s2', 's2'],
            ['s3s0', 's0'],
          ],
          pagination: { minId: 's6s2', maxId: 's1' },
          showImmediately: true,
        })
        expect(store.list.order).to.eql(statuses1)
        expect(store.list.statusIds).to.eql(new Set(statuses1))
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's4',
          's3s0',
          's2',
          's1',
        ]))
        expect(store.list).to.have.property('maxId', 's6s2')
        expect(store.list).to.have.property('minId', 's1')

        store.addStatusesToTimeline('list', '1', {
          statuses: statuses2,
          repeats: [
            ['sAs0', 's0'],
            ['s9s1', 's1'],
            ['s7s2', 's2'],
          ],
          pagination: { minId: 'sAs0', maxId: 's7s2' },
          showImmediately: true,
        })

        const newOrder = [...statuses2, ...statuses1]
        expect(store.list.order).to.eql(newOrder)
        expect(store.list.statusIds).to.eql(new Set(newOrder))
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's4',
          's3s0',
          's2',
          's1',
          // Newer
          's8',
        ]))
        expect(store.list).to.have.property('maxId', 'sAs0')
        expect(store.list).to.have.property('minId', 's1')
      })

      it('showNewStatuses follows de-duplication rules', () => {
        const store = useTimelinesStore()
        const statuses1 = ['s6s2', 's5s2', 's4', 's3s0', 's2', 's1']
        const statuses2 = ['sAs0', 's9s1', 's8', 's7s2']

        store.activate('list', '1')
        store.addStatusesToTimeline('list', '1', {
          statuses: statuses1,
          repeats: [
            ['s6s2', 's2'],
            ['s5s2', 's2'],
            ['s3s0', 's0'],
          ],
          pagination: { minId: 's6s2', maxId: 's1' },
          showImmediately: true,
        })
        expect(store.list.order).to.eql(statuses1)
        expect(store.list.statusIds).to.eql(new Set(statuses1))
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's4',
          's3s0',
          's2',
          's1',
        ]))
        expect(store.list).to.have.property('maxId', 's6s2')
        expect(store.list).to.have.property('minId', 's1')

        store.addStatusesToTimeline('list', '1', {
          statuses: statuses2,
          repeats: [
            ['sAs0', 's0'],
            ['s9s1', 's1'],
            ['s7s2', 's2'],
          ],
          pagination: { minId: 'sAs0', maxId: 's7s2' },
        })

        const newOrder = [...statuses2, ...statuses1]
        expect(store.list.order).to.eql(newOrder)
        expect(store.list.statusIds).to.eql(new Set(newOrder))
        expect(store.list.newStatusCount).to.eql(1)
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's4',
          's3s0',
          's2',
          's1',
        ]))

        store.showNewStatuses('list')
        expect(store.list.visibleStatusIds).to.eql(new Set([
          's4',
          's3s0',
          's2',
          's1',
          // Newer
          's8',
        ]))
      })
    })
  })

  describe('showNewStatuses', () => {
    it('resets counter and makes all ids visible', () => {
      const store = useTimelinesStore()
      const statuses = ['1', '2', '3']

      store.activate('public')
      store.addStatusesToTimeline('public', undefined, {
        statuses,
        repeats: [],
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.public.statusIds).to.eql(new Set(statuses))
      expect(store.public.visibleStatusIds).to.eql(new Set())
      expect(store.public.newStatusCount).to.equal(3)
      store.showNewStatuses('public')
      expect(store.public.visibleStatusIds).to.eql(new Set(statuses))
      expect(store.public.newStatusCount).to.equal(0)
    })

    it('limits shown items to 50 for better performance', () => {
      const store = useTimelinesStore()
      const statuses = new Array(100).fill().map((_, index) => 's' + index)

      store.activate('public')
      store.addStatusesToTimeline('public', undefined, {
        statuses,
        repeats: [],
        pagination: { minId: '1', maxId: '3' },
      })

      expect(store.public.statusIds).to.eql(new Set(statuses))
      expect(store.public.visibleStatusIds).to.eql(new Set())
      expect(store.public.newStatusCount).to.equal(100)
      store.showNewStatuses('public')
      expect(store.public.visibleStatusIds).to.eql(new Set(statuses.slice(0, 50)))
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
        repeats: [],
      })
      store.addStatusesToTimeline('friends', undefined, {
        statuses: ['5', '0', '9', '1'],
        repeats: [],
      })
      store.wipeStatuses(['0'])
      expect(store.friends.statusIds).to.not.have.members('0')
      expect(store.public.statusIds).to.not.have.members('0')
    })
  })
})
