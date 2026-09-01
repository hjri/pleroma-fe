import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useI18nStore } from 'src/stores/i18n.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useReportsStore } from 'src/stores/reports.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import * as USER_API from 'src/api/user.js'

const userId = '1'
const userScreenName = 'user'
const userName = 'Guy'
const userUrl = 'http://localhost/user'

const mockMastoAPIUser = ({
  screen_name = userScreenName,
  name = userName,
  url = userUrl,
  id = userId,
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

const mockUser = ({
  screen_name = userScreenName,
  id = userId,
  name = userName,
  url = userUrl,
} = {}) => ({
  _original: mockMastoAPIUser({
    screen_name,
    id,
    name,
    url,
  }),
  id,
  name,
  screen_name,
  url,
  relationship: undefined,
})

const mockStatus = ({
  id = '1',
  text,
  summary,
  type = 'status',
  statusUser = mockUser(),
} = {}) => ({
  id,
  user: statusUser,
  summary: summary ?? `Summary number ${id}`,
  name: 'status',
  text: text ?? `Text number ${id}`,
  uri: '',
  type,
  attentions: [],
  statusnet_conversation_id: 'c1',
  emoji_reactions: [],
})

const mockStatusNotification = ({
  id = '1',
  type = 'like',
  status = mockStatus({ id }),
  seen = false,
  user = mockUser(),
} = {}) => ({
  type,
  id,
  status,
  seen,
  user,
  from_profile: user,
})

describe('Notifications store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createTestingPinia({ stubActions: false }))
    useI18nStore().i18n = {
      t: () => {
        /* no-op */
      },
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('activate', () => {
    const store = useNotificationsStore()
    const sub = vi.fn()
    useStreamingStore().addSubscriber = sub

    store.activate()

    expect(sub).to.have.been.called
    expect(store.fetcher).to.not.be.null
    expect(store.socket).to.not.be.null

    store.deactivate()
  })

  it('deactivate', () => {
    const store = useNotificationsStore()
    const unsub = vi.fn()
    useStreamingStore().removeSubscriber = unsub

    store.activate()
    // Checking so that they were set properly before
    // since reset changes them to ''
    store.maxId = '2'
    store.minId = '1'
    store.idStore = new Map()
    store.idStore.set('1', {})
    store.idStore.set('2', {})
    store.deactivate()

    expect(unsub).to.have.been.called
    expect(store.fetcher).to.be.null
    expect(store.socket).to.be.null
    expect(store.idStore).to.have.length(0)
    expect(store).to.have.property('maxId', '')
    expect(store).to.have.property('minId', '')
  })

  it('updateExtremes should update min and max ids', () => {
    const store = useNotificationsStore()
    store.maxId = '10'
    store.minId = '05'

    store.updateExtremes('04')
    store.updateExtremes('11')

    expect(store).to.have.property('maxId', '11')
    expect(store).to.have.property('minId', '04')
  })

  describe('addNewNotifications', () => {
    it('adds notifications to the list', () => {
      const store = useNotificationsStore()

      store.addNewNotifications({
        timestamp: 1,
        data: [
          mockStatusNotification({ id: 'a' }),
          mockStatusNotification({ id: 'b' }),
        ],
      })

      // must be ordered
      expect(store.data.map(({ id }) => id)).to.eql(['a', 'b'])
      expect(store.idStore).to.have.keys(['a', 'b'])
      expect(store).to.have.property('maxId', 'b')
      expect(store).to.have.property('minId', 'a')
    })

    it('ignores duplicates', () => {
      const store = useNotificationsStore()

      store.addNewNotifications({
        timestamp: 1,
        data: [
          mockStatusNotification({ id: '2' }),
          mockStatusNotification({ id: '1' }),
        ],
      })

      store.addNewNotifications({
        timestamp: 1,
        data: [
          mockStatusNotification({ id: '3' }),
          mockStatusNotification({ id: '2' }),
        ],
      })

      // must be ordered
      expect(store.data.map(({ id }) => id)).to.eql(['3', '2', '1'])
      expect(store.idStore).to.have.keys(['1', '2', '3'])
      expect(store).to.have.property('maxId', '3')
      expect(store).to.have.property('minId', '1')
    })

    it('appends notifications if fetching older', () => {
      const store = useNotificationsStore()

      store.addNewNotifications({
        timestamp: 1,
        data: [
          mockStatusNotification({ id: '4' }),
          mockStatusNotification({ id: '3' }),
        ],
      })

      store.addNewNotifications(
        {
          timestamp: 1,
          data: [
            mockStatusNotification({ id: '2' }),
            mockStatusNotification({ id: '1' }),
          ],
        },
        true,
      )

      // must be ordered
      expect(store.data.map(({ id }) => id)).to.eql(['4', '3', '2', '1'])
      expect(store.idStore).to.have.keys(['1', '2', '3', '4'])
      expect(store).to.have.property('maxId', '4')
      expect(store).to.have.property('minId', '1')
    })

    it('should update usersStore', () => {
      const store = useNotificationsStore()
      const mock = vi.spyOn(useUsersStore(), 'addNewUsers')
      const mockedNotification = mockStatusNotification({ type: 'follow' })

      store.addNewNotifications({
        timestamp: 1337,
        data: [mockedNotification],
      })

      expect(mock).to.have.been.called
      expect(mock.mock.calls[0][0]).to.have.property('timestamp', 1337)
      expect(mock.mock.calls[0][0].data[0]).to.eql(
        mockedNotification.from_profile,
      )
    })

    it('should update reportsStore', (notificationType) => {
      const store = useNotificationsStore()
      const mock = vi.spyOn(useReportsStore(), 'addReport')
      const mockedNotification = mockStatusNotification({
        type: 'pleroma:report',
      })
      mockedNotification.report = { data: '123' }

      store.addNewNotifications({
        timestamp: 1337,
        data: [mockedNotification],
      })

      expect(mock).to.have.been.calledWith({ data: '123' })
    })

    it.each([
      'like',
      'mention',
      'status',
      'repeat',
      'pleroma:emoji_reaction',
      'poll',
    ])('should update statusesStore on %s notification', (notificationType) => {
      const store = useNotificationsStore()
      const mock = vi.fn()
      useStatusesStore().addNewStatuses = mock
      const mockedNotification = mockStatusNotification({
        type: notificationType,
      })

      store.addNewNotifications({
        timestamp: 1337,
        data: [mockedNotification],
      })

      expect(mock).to.have.been.called
      expect(mock.mock.calls[0][0]).to.have.property('timestamp', 1337)
      expect(mock.mock.calls[0][0].statuses[0]).to.eql(
        mockedNotification.status,
      )
    })
  })

  describe('wipeStatuses', () => {
    it('clears all statuses', () => {
      const store = useNotificationsStore()

      store.addNewNotifications({
        timestamp: 1,
        data: [
          mockStatusNotification({
            id: 'n2',
            status: mockStatus({ id: 's2' }),
          }),
          mockStatusNotification({
            id: 'n1',
            status: mockStatus({ id: 's1' }),
          }),
        ],
      })

      store.wipeStatuses(['s2'])
      expect(store.idStore).to.not.have.members('n2')
      expect(store.data.map(({ id }) => id)).to.eql(['n1'])
    })
  })

  describe('read/dismiss', () => {
    it('read single', () => {
      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useNotificationsStore()

      store.addNewNotifications({
        timestamp: 1337,
        data: [
          mockStatusNotification({ id: 'n3' }),
          mockStatusNotification({ id: 'n2' }),
          mockStatusNotification({ id: 'n1' }),
        ],
      })

      expect(store.data[1]).to.have.property('seen', false)

      store.markSingleNotificationAsSeen('n2')

      expect(store.data[0]).to.have.property('seen', false)
      expect(store.data[1]).to.have.property('seen', true)
      expect(store.data[0]).to.have.property('seen', false)

      const calls = mockFetch.mock.calls
      expect(calls).to.have.length(1)
      const callOne = calls[0]
      expect(callOne[0]).to.eql(USER_API.NOTIFICATION_READ_URL)
      const formData = Object.fromEntries(callOne[1].body.entries())
      expect(formData).to.eql({ id: 'n2' })
    })

    it('read all', () => {
      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: 'ok' }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useNotificationsStore()

      // FormData is weird to test
      store.addNewNotifications({
        timestamp: 1337,
        data: [
          mockStatusNotification({ id: 'n3' }),
          mockStatusNotification({ id: 'n2' }),
          mockStatusNotification({ id: 'n1' }),
        ],
      })

      expect(store.data[0]).to.have.property('seen', false)
      expect(store.data[1]).to.have.property('seen', false)
      expect(store.data[2]).to.have.property('seen', false)

      store.markNotificationsAsSeen()

      expect(store.data[0]).to.have.property('seen', true)
      expect(store.data[1]).to.have.property('seen', true)
      expect(store.data[2]).to.have.property('seen', true)

      // FormData is weird to test
      const calls = mockFetch.mock.calls
      expect(calls).to.have.length(1)
      const callOne = calls[0]
      expect(callOne[0]).to.eql(USER_API.NOTIFICATION_READ_URL)
      const formData = Object.fromEntries(callOne[1].body.entries())
      expect(formData).to.eql({ max_id: 'n3' })
    })
  })
})
