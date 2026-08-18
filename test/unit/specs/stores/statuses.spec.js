import { createTestingPinia } from '@pinia/testing'
import { snakeCase } from 'lodash'
import { setActivePinia } from 'pinia'

import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useUsersStore } from 'src/stores/users.js'

import * as PUBLIC_API from 'src/api/public.js'
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
  type = 'status',
  statusUser = mockUser(),
} = {}) => ({
  id,
  user: statusUser,
  name: 'status',
  text: text ?? `Text number ${id}`,
  uri: '',
  type,
  attentions: [],
  statusnet_conversation_id: 'c1',
  emoji_reactions: [],
})

const mockMastoAPIStatus = ({
  id = '1',
  text,
  type = 'status',
  statusUser = mockMastoAPIUser(),
} = {}) => ({
  id,
  account: statusUser,
  name: 'status',
  content: text ?? `Text number ${id}`,
  uri: '',
  type,
  attentions: [],
  statusnet_conversation_id: 'c1',
})

const DEFAULT_OPTIONS = (method = 'GET') => ({
  method,
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

describe('Statuses store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  it('init', () => {
    const store = useStatusesStore()
    const sub = vi.fn()
    useStreamingStore().addSubscriber = sub

    store.attachSocket()

    expect(store.socket).to.not.be.null
    expect(sub).to.have.been.called
  })

  it('resetStatuses', () => {
    const store = useStatusesStore()
    const statuses = [...new Array(20)].map((empty, index) =>
      mockStatus({
        id: 's' + index,
        statusUser: mockUser({ id: 'u' + index }),
      }),
    )

    store.attachSocket()
    store.addNewStatuses({
      statuses,
      timestamp: 1,
    })
    store.resetStatuses()
    expect(store.allStatuses).to.have.length(0)
  })

  describe('addNewStatuses', () => {
    beforeEach(() => {
      const usersStore = useUsersStore()
      usersStore.addNewUsers = vi.fn().mockReturnValue([mockUser()])
    })

    it('adds the status to allStatuses', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })

      store.addNewStatuses({
        statuses: [status],
        timestamp: 1,
      })

      expect(store.allStatuses).to.eql(new Map([['1', status]]))
      expect(store.conversations).to.eql(new Map([['c1', new Set(['1'])]]))
      expect(usersStore.addNewUsers).to.have.callCount(1)
    })

    it('splits retweets from their status and links them', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const retweet = mockStatus({
        id: '2',
        type: 'retweet',
        user: mockUser({ id: '2' }),
      })
      retweet.type = 'retweet'
      retweet.retweeted_status = status

      store.addNewStatuses({
        statuses: [retweet],
        timestamp: 1,
      })

      expect(store.allStatuses).to.eql(
        new Map([
          ['1', status],
          ['2', retweet],
        ]),
      )
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })

    it('splits quotes from their status and links them', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const quote = mockStatus({ id: '2' })
      quote.quote = status

      store.addNewStatuses({
        statuses: [quote],
        timestamp: 1,
      })

      expect(store.allStatuses).to.eql(
        new Map([
          ['1', status],
          ['2', quote],
        ]),
      )
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })

    it('replaces existing statuses with the same id', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const modStatus = mockStatus({ id: '1', text: 'something else' })

      store.addNewStatuses({
        statuses: [status],
        timestamp: 1991,
      })
      expect(store.allStatuses).to.eql(new Map([['1', status]]))

      store.addNewStatuses({
        statuses: [modStatus],
        timestamp: 2000,
      })
      expect(store.allStatuses).to.eql(new Map([['1', modStatus]]))
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })

    it('handles edits', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const modStatus = mockStatus({
        id: '1',
        text: 'something else',
        type: 'edit',
      })

      store.addNewStatuses({
        statuses: [status],
        timestamp: 1991,
      })
      expect(store.allStatuses).to.eql(new Map([['1', status]]))

      store.addNewStatuses({
        statuses: [modStatus],
        timestamp: 2000,
      })
      expect(store.allStatuses).to.eql(new Map([['1', modStatus]]))
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })

    it('ignores updates with older timestamp', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const modStatus = mockStatus({ id: '1', text: 'something else' })

      store.addNewStatuses({
        statuses: [status],
        timestamp: 2000,
      })
      expect(store.allStatuses).to.eql(new Map([['1', status]]))

      store.addNewStatuses({
        statuses: [modStatus],
        timestamp: 1991,
      })
      expect(store.allStatuses).to.eql(new Map([['1', status]]))
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })

    it('calls useUsersStore().addNewUsers() even on older timestamp', () => {
      const store = useStatusesStore()
      const usersStore = useUsersStore()
      const status = mockStatus({ id: '1' })
      const modStatus = mockStatus({ id: '1', text: 'something else' })

      store.addNewStatuses({
        statuses: [status],
        timestamp: 2000,
      })
      store.addNewStatuses({
        statuses: [modStatus],
        timestamp: 1991,
      })
      expect(usersStore.addNewUsers).to.have.callCount(2)
    })
  })

  describe('fetchers', () => {
    it.each([
      [
        'StatusSource',
        {
          content_type: 'text/plain',
          text: 'Text',
          spoiler_text: 'Text',
        },
      ],
      [
        'EmojiReactions',
        [
          {
            accounts: [mockMastoAPIUser()],
            count: 1,
            me: false,
            name: 'cofe',
            url: '',
          },
        ],
      ],
      ['Favs', [mockMastoAPIUser()]],
      ['Repeats', [mockMastoAPIUser()]],
    ])('fetch%s', async (group, mockedResponse) => {
      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockedResponse), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      let urlKey
      let prefix = 'MASTODON'
      if (group === 'Favs') {
        urlKey = 'STATUS_FAVORITEDBY'
      } else if (group === 'Repeats') {
        urlKey = 'STATUS_REBLOGGEDBY'
      } else {
        urlKey = snakeCase(group).toUpperCase()
      }
      if (group === 'EmojiReactions') {
        prefix = 'PLEROMA'
      }

      const url = PUBLIC_API[`${prefix}_${urlKey}_URL`]('id')

      const store = useStatusesStore()
      const status = mockStatus({ id: 'id' })
      store.addNewStatuses({
        statuses: [status],
        timestamp: 2000,
      })

      const result = await store[`fetch${group}`]('id')
      const updated = store.allStatuses.get('id')

      expect(mockFetch).to.have.been.calledWith(url, DEFAULT_OPTIONS())
      if (group === 'Favs') {
        expect(updated.favoritedBy).to.have.length(1)
        expect(updated.fave_num).to.eql(1)
      } else if (group === 'Repeats') {
        expect(updated.rebloggedBy).to.have.length(1)
        expect(updated.repeat_num).to.eql(1)
      } else if (group === 'EmojiReactions') {
        expect(updated.emoji_reactions).to.have.length(mockedResponse.length)
        expect(updated.emoji_reactions[0].name).to.eql(mockedResponse[0].name)
      } else {
        expect(result).to.eql(mockedResponse)
      }
    })

    it('fetchFavsAndRepeats', async () => {
      const store = useStatusesStore()
      store.fetchFavs = vi.fn().mockResolvedValue(async () => {
        /* no-op */
      })
      store.fetchRepeats = vi.fn().mockResolvedValue(async () => {
        /* no-op */
      })

      await store.fetchFavsAndRepeats('id')
      expect(store.fetchFavs).to.have.been.calledWith('id')
      expect(store.fetchRepeats).to.have.been.calledWith('id')
    })

    it('fetchStatus', async () => {
      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockMastoAPIStatus()), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useStatusesStore()
      await store.fetchStatus('id')

      expect(mockFetch).to.have.been.calledWith(
        PUBLIC_API.MASTODON_STATUS_URL('id'),
        DEFAULT_OPTIONS(),
      )
      expect(store.allStatuses).to.have.length(1)
    })
  })

  describe('interactions', () => {
    it.each([
      ['favorite', 'MASTODON_FAVORITE_URL'],
      ['unfavorite', 'MASTODON_UNFAVORITE_URL'],
      ['retweet', 'MASTODON_RETWEET_URL'],
      ['unretweet', 'MASTODON_UNRETWEET_URL'],
      ['reactWithEmoji', 'PLEROMA_EMOJI_REACT_URL', 'PUT'],
      ['unreactWithEmoji', 'PLEROMA_EMOJI_UNREACT_URL', 'DELETE'],
      [
        'bookmark',
        'MASTODON_BOOKMARK_STATUS_URL',
        undefined,
        { folder_id: 'argument' },
      ],
      ['unbookmark', 'MASTODON_UNBOOKMARK_STATUS_URL'],
      ['pinStatus', 'MASTODON_PIN_OWN_STATUS_URL'],
      ['unpinStatus', 'MASTODON_UNPIN_OWN_STATUS_URL'],
      ['muteConversation', 'MASTODON_MUTE_CONVERSATION_URL'],
      ['unmuteConversation', 'MASTODON_UNMUTE_CONVERSATION_URL'],
      ['deleteStatus', 'MASTODON_DELETE_URL', 'DELETE'],
    ])('%s - api call', async (interaction, urlKey, method = 'POST', body) => {
      const url = USER_API[urlKey]('1', 'argument')

      const status = mockStatus()
      const store = useStatusesStore()
      store.addNewStatuses({
        statuses: [status],
        timestamp: 1,
      })

      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockMastoAPIStatus({ text: 'Updated' })), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)
      await store[interaction]('1', 'argument')
      const expectedArg = DEFAULT_OPTIONS(method)

      if (body) {
        expectedArg.body = JSON.stringify(body)
      }

      expect(mockFetch).to.have.been.calledWith(url, expectedArg)
      if (interaction === 'deleteStatus') {
        expect(store.allStatuses.get('1').deleted).to.be.true
      } else {
        expect(store.allStatuses.get('1').text).to.eql('Updated')
      }
    })

    const optimismInteractions = [
      ['favorite', 'favorited', 'fave_num'],
      ['retweet', 'repeated', 'repeat_num'],
      ['bookmark', 'bookmarked'],
      ['muteConversation', 'thread_muted'],
    ]
      .map(([method, property, count]) => [
        [method, property, count],
        ['un' + method, property, count],
      ])
      .flat()

    it.each(
      optimismInteractions,
    )('%s - optimism call', async (method, property, count) => {
      // Prepare our status
      const status = mockStatus()
      const negate = method.startsWith('un')
      const oldCount = 9
      const newCount = negate ? 8 : 10
      status[property] = negate
      if (count) {
        status[count] = oldCount
      }
      if (method === 'unbookmark') {
        status.bookmark_folder_id = 'argument'
      }

      // Insert it
      const store = useStatusesStore()
      store.addNewStatuses({
        statuses: [status],
        timestamp: 1,
      })

      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockMastoAPIStatus({ text: 'Updated' })), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      expect(store.allStatuses.get('1')).to.have.property(property, negate)
      if (count) {
        expect(store.allStatuses.get('1')).to.have.property(count, oldCount)
      }
      vi.stubGlobal('fetch', mockFetch)

      store[method]('1', 'argument')
      expect(store.allStatuses.get('1')).to.have.property(property, !negate)
      if (count) {
        expect(store.allStatuses.get('1')).to.have.property(count, newCount)
      }
      if (property === 'bookmarked') {
        expect(store.allStatuses.get('1')).to.have.property(
          'bookmark_folder_id',
          'argument',
        )
      }
    })

    it.each(
      optimismInteractions,
    )('%s - optimism fail', async (method, property, count) => {
      // Prepare our status
      const status = mockStatus()
      const negate = method.startsWith('un')
      const oldCount = 9
      status[property] = negate
      if (count) {
        status[count] = oldCount
      }
      if (method === 'unbookmark') {
        status.bookmark_folder_id = 'argument'
      }

      // Insert it
      const store = useStatusesStore()
      store.addNewStatuses({
        statuses: [status],
        timestamp: 1,
      })

      const mockFetch = vi.fn()
      mockFetch.mockRejectedValueOnce(new Error('Failure!'))

      expect(store.allStatuses.get('1')).to.have.property(property, negate)
      if (count) {
        expect(store.allStatuses.get('1')).to.have.property(count, oldCount)
      }
      vi.stubGlobal('fetch', mockFetch)

      await store[method]('1', 'argument')
      expect(store.allStatuses.get('1')).to.have.property(property, negate)
      if (count) {
        expect(store.allStatuses.get('1')).to.have.property(count, oldCount)
      }

      // Failing 'bookmark' method SHOULD clear folder id
      if (method === 'unbookmark') {
        expect(store.allStatuses.get('1')).to.have.property(
          'bookmark_folder_id',
          'argument',
        )
      }
    })

    it.each([
      ['reactWithEmoji', 0],
      ['unreactWithEmoji', 1],
      ['reactWithEmoji', 1],
      ['unreactWithEmoji', 2],
    ])('%s count: %s - optimism call', async (method, oldCount) => {
      // Prepare our status
      const status = mockStatus()
      const negate = method.startsWith('un')
      const newCount = negate ? oldCount - 1 : oldCount + 1

      useUsersStore().currentUser = mockUser()

      if (oldCount > 0) {
        const reactors = [...new Array(oldCount)].map((empty, index) =>
          mockUser({ id: 'o' + index }),
        )
        if (negate) {
          // Replace one of reactors with ourselves
          reactors[0] = useUsersStore().currentUser
        }
        status.emoji_reactions = [
          {
            name: 'hyperlol',
            count: oldCount,
            accounts: reactors,
          },
        ]
      } else {
        status.emoji_reactions = []
      }

      // Insert it
      const store = useStatusesStore()
      store.addNewStatuses({
        statuses: [status],
        timestamp: 1,
      })

      const mockFetch = vi.fn()
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockMastoAPIStatus({ text: 'Updated' })), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)
      const expected = store.allStatuses.get('1')

      expect(expected.emoji_reactions).to.have.length(oldCount === 0 ? 0 : 1)
      if (oldCount !== 0) {
        expect(expected.emoji_reactions[0].name).to.eql('hyperlol')
        expect(expected.emoji_reactions[0].count).to.eql(oldCount)
        expect(expected.emoji_reactions[0].accounts).to.have.length(oldCount)
      }

      store[method]('1', 'hyperlol')

      expect(expected.emoji_reactions).to.have.length(newCount === 0 ? 0 : 1)
      if (newCount !== 0) {
        expect(expected.emoji_reactions[0].name).to.eql('hyperlol')
        expect(expected.emoji_reactions[0].count).to.eql(newCount)
        expect(expected.emoji_reactions[0].accounts).to.have.length(newCount)
      }
    })
  })

  it('wipeUserStatuses', () => {
    const store = useStatusesStore()
    const statuses = [...new Array(20)].map((empty, index) =>
      mockStatus({
        id: 's' + index,
        statusUser: mockUser({ id: 'u' + index }),
      }),
    )

    store.addNewStatuses({
      statuses,
      timestamp: 1,
    })

    const result = store.wipeUserStatuses('u19')

    expect(store.allStatuses).to.have.length(19)
    expect(result).to.eql(new Set(['s19']))
  })
})
