import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useFollowRequestsStore } from 'src/stores/follow_requests.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useUsersStore } from 'src/stores/users.js'

import * as USER_API from 'src/api/user.js'

const mockMastoAPIUser = ({
  screen_name = 'u1',
  name = 'user1',
  url = 'http://localhost/u1',
  id = 'u1',
} = {}) => ({
  id,
  acct: screen_name,
  display_name: name,
  fields: [],
  avatar: '',
  url,
  pleroma: {
    emoji_reactions: [],
  },
})

describe('Follow Requests store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  describe('Getters', () => {
    it('followRequestsCount returns total number of follow requests', async () => {
      const store = useFollowRequestsStore()

      store.requests = new Map([
        ['1', {}],
        ['2', {}],
      ])

      expect(store).to.have.property('followRequestsCount', 2)
    })
  })

  describe('Actions', () => {
    describe('Fetcher stuff', () => {
      it('startFetching should initialize fetcher and fetch some data', async () => {
        const store = useFollowRequestsStore()
        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify([mockMastoAPIUser()]), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify([mockMastoAPIUser()]), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        store.startFetching()
        expect(store.fetcher).to.not.be.null

        await vi.advanceTimersToNextTimerAsync()
        expect(mockFetch).to.have.been.calledOnce

        await vi.advanceTimersToNextTimerAsync()
        expect(mockFetch).to.have.been.calledTwice
        expect(useUsersStore().findUser('u1')).to.not.be.undefined
        expect(store.requests.get('u1')).to.not.be.undefined
      })

      it('stopFetching should stop and remove the fetcher', async () => {
        const store = useFollowRequestsStore()
        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify([mockMastoAPIUser()]), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        mockFetch.mockResolvedValueOnce(
          new Response(JSON.stringify([mockMastoAPIUser()]), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        store.startFetching()
        expect(store.fetcher).to.not.be.null

        store.stopFetching()
        expect(store.fetcher).to.be.null
      })
    })

    describe.each(['Approve', 'Deny'])('%s', (intent) => {
      const doCall = `do${intent}`
      const apiCall = USER_API[`MASTODON_${intent.toUpperCase()}_USER_URL`]
      const forkCall = intent.toLowerCase()
      const forkProperty = `modalOn${intent}Follow`
      const modalProperty = `showing${intent}ConfirmDialog`
      const modalCalls = ['show', 'hide'].map(
        (vis) => `${vis}${intent}ConfirmDialog`,
      )

      describe('Dialog calls', () => {
        it(`${modalCalls[0]} should show dialog and set tempId`, async () => {
          const store = useFollowRequestsStore()

          await store[modalCalls[0]]('u13')

          expect(store).to.have.property(modalProperty, true)
          expect(store).to.have.property('tempId', 'u13')
        })

        it(`${modalCalls[1]} should hide dialog and clear tempId`, async () => {
          const store = useFollowRequestsStore()

          await store[modalCalls[1]]()

          expect(store).to.have.property(modalProperty, false)
          expect(store).to.have.property('tempId', null)
        })
      })

      describe('Fork calls', () => {
        it(`Should call ${doCall} if confirmations are disabled (${forkProperty} = false)`, async () => {
          const store = useFollowRequestsStore()
          const modalSpy = vi
            .spyOn(store, modalCalls[0])
            .mockImplementation(() => ({}))
          const apiSpy = vi.spyOn(store, doCall).mockImplementation(() => ({}))
          useMergedConfigStore().mergedConfig = { [forkProperty]: false }

          await store[forkCall]('u23')

          expect(modalSpy).to.not.have.been.called
          expect(apiSpy).to.have.been.calledOnce
          expect(apiSpy).to.have.been.calledWith('u23')
        })

        it(`Should call ${modalCalls[0]} if confirmations are enabled (${forkProperty} = true)`, async () => {
          const store = useFollowRequestsStore()
          const modalSpy = vi
            .spyOn(store, modalCalls[0])
            .mockImplementation(() => ({}))
          const apiSpy = vi.spyOn(store, doCall).mockImplementation(() => ({}))
          useMergedConfigStore().mergedConfig = { [forkProperty]: true }

          await store[forkCall]('u23')

          expect(modalSpy).to.have.been.called
          expect(apiSpy).to.not.have.been.calledOnce
        })
      })

      describe('Actual call', () => {
        it('Should hide popover', async () => {
          const store = useFollowRequestsStore()
          const spy = vi.spyOn(store, modalCalls[1])
          const mockFetch = vi.fn()

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          vi.stubGlobal('fetch', mockFetch)

          await store[doCall]()

          expect(spy).to.have.been.calledOnce
        })

        it('Should call API', async () => {
          const store = useFollowRequestsStore()
          const mockFetch = vi.fn()

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          vi.stubGlobal('fetch', mockFetch)

          await store[doCall]('u99')

          expect(mockFetch).to.have.been.calledOnce
          expect(mockFetch.mock.calls[0][0]).to.eql(apiCall('u99'))
        })

        it('Should mark notification as seen', async () => {
          const store = useFollowRequestsStore()
          const mockFetch = vi.fn()
          store.findFollowRequestNotificationId = vi.fn()
          store.findFollowRequestNotificationId.mockReturnValue('n91')

          const spy = vi.spyOn(
            useNotificationsStore(),
            'markSingleNotificationAsSeen',
          )

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          vi.stubGlobal('fetch', mockFetch)

          await store[doCall]('u99')

          expect(spy).to.have.been.calledOnce
          expect(spy).to.have.been.calledWith('n91')
        })

        it('Should fallback to tempId if no id is provided', async () => {
          const store = useFollowRequestsStore()
          const mockFetch = vi.fn()

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          vi.stubGlobal('fetch', mockFetch)

          store.tempId = 'u80'
          await store[doCall]()

          expect(mockFetch).to.have.been.calledOnce
          expect(mockFetch.mock.calls[0][0]).to.eql(apiCall('u80'))
        })

        it('Should remove request from cache', async () => {
          const store = useFollowRequestsStore()
          const mockFetch = vi.fn()

          store.requests.set('u95', { id: 'u95' })
          store.requests.set('u96', { id: 'u96' })
          store.requests.set('u97', { id: 'u97' })
          store.requests.set('u98', { id: 'u98' })
          store.requests.set('u99', { id: 'u99' })

          mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

          vi.stubGlobal('fetch', mockFetch)

          await store[doCall]('u99')

          expect(store.requests).to.have.length(4)
          expect(store.requests.get('u99')).to.be.undefined
        })
      })
    })

    describe('Utility', () => {
      describe('findFollowRequestNotificationId', () => {
        it('should search notifications store for relevant notification', () => {
          const store = useFollowRequestsStore()

          useNotificationsStore().data = [
            {
              id: 'n4',
              from_profile: { id: 'u3' },
              type: 'follow_request',
            },
            {
              id: 'n3',
              from_profile: { id: 'u2' },
              type: 'repeat',
            },
            {
              id: 'n2',
              from_profile: { id: 'u1' },
              type: 'follow_request',
            },
            {
              id: 'n1',
              from_profile: { id: 'u1' },
              type: 'favorite',
            },
          ]

          const result = store.findFollowRequestNotificationId('u1')

          expect(result).to.have.eql('n2')
        })

        it("shouldn't crash if there is no notification available", () => {
          const store = useFollowRequestsStore()

          useNotificationsStore().data = [
            {
              id: 'n4',
              from_profile: { id: 'u3' },
              type: 'follow_request',
            },
            {
              id: 'n3',
              from_profile: { id: 'u2' },
              type: 'repeat',
            },
            {
              id: 'n2',
              from_profile: { id: 'u1' },
              type: 'follow_request',
            },
            {
              id: 'n1',
              from_profile: { id: 'u1' },
              type: 'favorite',
            },
          ]

          const result = store.findFollowRequestNotificationId('u5')

          expect(result).to.have.eql(undefined)
        })
      })
    })
  })
})
