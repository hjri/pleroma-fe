import { createTestingPinia } from '@pinia/testing'
import { snakeCase } from 'lodash'
import { setActivePinia } from 'pinia'

import { useAnnouncementsStore } from 'src/stores/announcements.js'
import { useBookmarkFoldersStore } from 'src/stores/bookmark_folders.js'
import { useChatsStore } from 'src/stores/chats.js'
import { useEmojiStore } from 'src/stores/emoji.js'
import { useInstanceCapabilitiesStore } from 'src/stores/instance_capabilities.js'
import { useInterfaceStore } from 'src/stores/interface.js'
import { useListsStore } from 'src/stores/lists.js'
import { useMergedConfigStore } from 'src/stores/merged_config.js'
import { useNotificationsStore } from 'src/stores/notifications.js'
import { useOAuthStore } from 'src/stores/oauth.js'
import { useStatusesStore } from 'src/stores/statuses.js'
import { useStreamingStore } from 'src/stores/streaming.js'
import { useSyncConfigStore } from 'src/stores/sync_config.js'
import { useTimelinesStore } from 'src/stores/timelines.js'
import { useUserHighlightStore } from 'src/stores/user_highlight.js'
import { useUsersStore } from 'src/stores/users.js'

import * as PUBLIC_API from 'src/api/public.js'
import * as USER_API from 'src/api/user.js'

const DEFAULT_OPTIONS = (method = 'POST') => ({
  method,
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const actionKeys = (action) => {
  const result = {}
  if (action === 'removeUserFromFollowers') {
    result.storeAction = action
  } else {
    result.storeAction = action + 'User'
  }

  result.apiUrl = `MASTODON_${snakeCase(result.storeAction).toUpperCase()}_URL`
  return result
}

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

describe('Users store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  describe('addNewUsers', () => {
    describe('users', () => {
      it('adds new users to the set, merging in new information for old users', () => {
        const store = useUsersStore()

        const modUser = mockUser({ name: 'Dude' })

        store.addNewUsers({ data: [mockUser()], timestamp: 1 })
        expect(store.users).to.have.length(1)
        expect(store.users).to.have.all.keys(userId)

        store.addNewUsers({ data: [modUser], timestamp: 2 })
        expect(store.users).to.have.length(1)
        expect(store.users).to.have.all.keys(userId)
        expect(store.users.get(userId).name).to.eql('Dude')
      })

      it('ignores new users if timestamp is older', () => {
        const store = useUsersStore()

        const modUser = mockUser({ name: 'Old guy' })

        store.addNewUsers({ data: [mockUser()], timestamp: 2000 })
        expect(store.users).to.have.length(1)
        expect(store.users).to.have.all.keys(userId)
        expect(store.users.get(userId).name).to.eql('Guy')

        store.addNewUsers({ data: [modUser], timestamp: 1991 })
        expect(store.users).to.have.length(1)
        expect(store.users).to.have.all.keys(userId)
        expect(store.users.get(userId).name).to.eql('Guy')
      })

      it('merging array field in new information for old users', () => {
        const store = useUsersStore()

        const userFields = {
          ...mockUser(),
          fields: [{ name: 'Label 1', value: 'Content 1' }],
        }
        const firstModUser = {
          ...mockUser(),
          fields: [
            { name: 'Label 2', value: 'Content 2' },
            { name: 'Label 3', value: 'Content 3' },
          ],
        }
        const secondModUser = {
          ...mockUser(),
          fields: [{ name: 'Label 4', value: 'Content 4' }],
        }

        store.addNewUsers({ data: [userFields], timestamp: 1 })
        const reactive = store.users.get(userId)
        expect(reactive.fields).to.have.length(1)
        expect(reactive.fields[0].name).to.eql('Label 1')

        store.addNewUsers({ data: [firstModUser], timestamp: 2 })
        expect(reactive.fields).to.have.length(2)
        expect(reactive.fields[0].name).to.eql('Label 2')
        expect(reactive.fields[1].name).to.eql('Label 3')

        store.addNewUsers({ data: [secondModUser], timestamp: 3 })
        expect(reactive.fields).to.have.length(1)
        expect(reactive.fields[0].name).to.eql('Label 4')
      })
    })

    describe('relationships', () => {
      it('updates relationship information if present', () => {
        const store = useUsersStore()

        const modUser = {
          ...mockUser(),
          relationship: {
            id: userId,
            following: true,
          },
        }

        store.addNewUsers({ data: [mockUser()], timestamp: 1 })
        store.addNewUsers({ data: [modUser], timestamp: 2 })

        expect(store.relationships).to.have.length(1)
        expect(store.relationships).to.have.all.keys(userId)
        expect(store.relationship(userId).following).to.eql(true)
        expect(store.findUser(userId).relationship.following).to.eql(true)
      })

      it('updates relationship information if present even if user timestamp is older', () => {
        const store = useUsersStore()

        const modUser = {
          ...mockUser({ name: 'Old Dude' }),
          relationship: {
            id: userId,
            following: true,
          },
        }

        store.addNewUsers({ data: [mockUser()], timestamp: 2000 })
        store.addNewUsers({ data: [modUser], timestamp: 1991 })

        expect(store.relationships).to.have.length(1)
        expect(store.relationships).to.have.all.keys(userId)
        expect(store.relationship(userId).following).to.eql(true)
        expect(store.findUser(userId).relationship.following).to.eql(true)
      })

      it("doesn't erase relationship information if new data has it missing", () => {
        const store = useUsersStore()

        const modUser = mockUser({ name: 'Dude' })

        store.addNewUsers({
          data: [
            { ...mockUser(), relationship: { id: userId, following: true } },
          ],
          timestamp: 1,
        })
        store.addNewUsers({ data: [modUser], timestamp: 2 })

        expect(store.relationships).to.have.length(1)
        expect(store.relationships).to.have.all.keys(userId)
        expect(store.relationship(userId).following).to.eql(true)
        expect(store.findUser(userId).relationship.following).to.eql(true)
      })
    })
  })

  describe('updateUserRelationships', () => {
    it('updates existing user relationship', () => {
      const store = useUsersStore()
      const relationship = { id: userId, following: true }

      store.addNewUsers({ data: [mockUser()], timestamp: 1 })
      store.updateUserRelationships({ data: relationship, timestamp: 2 })

      expect(store.relationship(userId)).to.eql({ id: userId, following: true })
      expect(store.findUser(userId).relationship.following).to.eql(true)
    })

    it('stores relationship for missing user', () => {
      const store = useUsersStore()
      const relationship = { id: userId, following: true }

      store.updateUserRelationships({ data: relationship, timestamp: 1 })

      expect(store.relationship(userId)).to.eql({ id: userId, following: true })
    })

    it('assigns relationship for missing user when it becomes available', () => {
      const store = useUsersStore()
      const relationship = { id: userId, following: true }

      store.updateUserRelationships({ data: relationship, timestamp: 1 })
      store.addNewUsers({ data: [mockUser()], timestamp: 2 })

      expect(store.relationship(userId)).to.eql({ id: userId, following: true })
      expect(store.findUser(userId).relationship).to.eql({
        id: userId,
        following: true,
      })
    })

    it('ignores relationship update if timestamp is older than existing', () => {
      const store = useUsersStore()
      const oldRelationship = { id: userId, following: true }
      const newRelationship = { id: userId, following: false }

      store.addNewUsers({
        data: [{ ...mockUser(), relationship: newRelationship }],
        timestamp: 2000,
      })
      store.updateUserRelationships({ data: oldRelationship, timestamp: 1991 })

      expect(store.relationship(userId)).to.eql({
        id: userId,
        following: false,
      })
      expect(store.findUser(userId).relationship.following).to.eql(false)
    })
  })

  describe('fetchers', () => {
    describe('fetchUserIfMissing', () => {
      it('should fetch requested user, add it to store and return it', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValueOnce(
            new Response(JSON.stringify(mockMastoAPIUser()), {
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        )

        const expected = mockUser()
        const store = useUsersStore()
        const resultUser = await store.fetchUserIfMissing({ id: '1' })

        expect(resultUser).to.deep.include(expected)
        expect(store.findUser(userId)).to.deep.include(expected)
      })

      it('Should re-use existing promise for other fetches', async () => {
        vi.stubGlobal(
          'fetch',
          vi
            .fn()
            .mockResolvedValueOnce(
              new Response(JSON.stringify({ id: '1' }), {
                headers: { 'Content-Type': 'application/json' },
              }),
            )
            // fetch by name yields user id which we request next
            .mockResolvedValueOnce(
              new Response(JSON.stringify(mockMastoAPIUser()), {
                headers: { 'Content-Type': 'application/json' },
              }),
            )
            .mockThrowOnce(new Error("Shouldn't be called more than once")),
        )

        const expected = mockUser()
        const store = useUsersStore()
        const resultUser1 = await store.fetchUserIfMissing({ name: 'user' })
        const resultUser2 = await store.fetchUserIfMissing({ id: '1' })

        expect(resultUser1).to.deep.include(expected)
        expect(resultUser2).to.deep.include(expected)
        expect(store.findUser(userId)).to.deep.include(expected)
      })

      it('Should use cached data if present', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockThrowOnce(new Error("Shouldn't be called at all")),
        )
        const store = useUsersStore()
        store.addNewUsers({ data: [mockUser()], timestamp: 1 })

        const resultUser1 = await store.fetchUserIfMissing({ id: '1' })
        const resultUser2 = await store.fetchUserIfMissing({ name: 'user' })
        const expected = mockUser()

        expect(resultUser1).to.deep.include(expected)
        expect(resultUser2).to.deep.include(expected)
        expect(store.findUser(userId)).to.deep.include(expected)
      })

      it('Should handle 404 gracefully', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValueOnce(
            new Response(JSON.stringify(mockMastoAPIUser()), {
              status: 404,
              statusText: 'Not Found',
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        )
        const store = useUsersStore()

        const resultUser = await store.fetchUserIfMissing({ id: '1' })

        expect(resultUser).to.be.null
      })

      it('Should throw if no identifier is provided', async () => {
        const store = useUsersStore()

        await expect(
          async () => await store.fetchUserIfMissing({}),
        ).rejects.to.throw(TypeError)
        await expect(
          async () => await store.fetchUserIfMissing(),
        ).rejects.to.throw(TypeError)
      })
    })

    describe('relationships', () => {
      it.each(['Friends', 'Followers'])('fetch%s', async (group) => {
        const mockFetch = vi
          .fn()
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify([
                mockMastoAPIUser({
                  screen_name: 'snake',
                  name: 'John',
                  id: '2',
                }),
                mockMastoAPIUser({
                  screen_name: 'zero',
                  name: 'David Oh',
                  id: '3',
                }),
              ]),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify([
                mockMastoAPIUser({
                  screen_name: 'sigint',
                  name: 'Mr.Anderson',
                  id: '4',
                }),
                mockMastoAPIUser({
                  screen_name: 'paramedic',
                  name: 'Dr.Clark',
                  id: '5',
                }),
              ]),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )

        vi.stubGlobal('fetch', mockFetch)

        const store = useUsersStore()
        store.addNewUsers({ timestamp: 1, data: mockUser() })

        const urlGroup = group === 'Friends' ? 'Following' : group
        const us = store.users.get(userId)

        await store[`fetch${group}`](userId)
        expect(mockFetch).to.have.been.calledWith(
          PUBLIC_API[`MASTODON_${urlGroup.toUpperCase()}_URL`](userId, {
            limit: 20,
            withRelationships: true,
          }),
          DEFAULT_OPTIONS('GET'),
        )
        expect(
          store.relationshipsLists[group.toLowerCase()].get(us),
        ).to.have.length(2)

        await store[`fetch${group}`](userId)
        expect(mockFetch).to.have.been.calledWith(
          PUBLIC_API[`MASTODON_${urlGroup.toUpperCase()}_URL`](userId, {
            maxId: '3',
            limit: 20,
            withRelationships: true,
          }),
          DEFAULT_OPTIONS('GET'),
        )
        expect(
          store.relationshipsLists[group.toLowerCase()].get(us),
        ).to.have.length(4)
      })

      it.each(['Mutes', 'Blocks'])('fetch%s', async (group) => {
        const mockFetch = vi
          .fn()
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify([
                mockMastoAPIUser({
                  screen_name: 'snake',
                  name: 'John',
                  id: '2',
                }),
                mockMastoAPIUser({
                  screen_name: 'zero',
                  name: 'David Oh',
                  id: '3',
                }),
              ]),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )
          .mockResolvedValueOnce(
            new Response(
              JSON.stringify([
                mockMastoAPIUser({
                  screen_name: 'sigint',
                  name: 'Mr.Anderson',
                  id: '4',
                }),
                mockMastoAPIUser({
                  screen_name: 'paramedic',
                  name: 'Dr.Clark',
                  id: '5',
                }),
              ]),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )

        vi.stubGlobal('fetch', mockFetch)

        const store = useUsersStore()
        store.addNewUsers({ timestamp: 1, data: mockUser() })

        const us = store.users.get(userId)

        store.currentUser = us
        const ids = group === 'Mutes' ? 'muteIds' : 'blockIds'

        await store[`fetch${group}`]({ reset: true })
        expect(mockFetch).to.have.been.calledWith(
          USER_API[`MASTODON_USER_${group.toUpperCase()}_URL`]({
            withRelationships: true,
          }),
          DEFAULT_OPTIONS('GET'),
        )
        expect(us[ids]).to.have.length(2)

        await store[`fetch${group}`]()
        expect(mockFetch).to.have.been.calledWith(
          USER_API[`MASTODON_USER_${group.toUpperCase()}_URL`]({
            withRelationships: true,
          }),
          DEFAULT_OPTIONS('GET'),
        )
        expect(us[ids]).to.have.length(4)
      })

      it('fetchDomainMutes', async () => {
        const mockFetch = vi.fn().mockResolvedValueOnce(
          new Response(JSON.stringify(['example.com', 'example.org']), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        const store = useUsersStore()
        store.addNewUsers({ timestamp: 1, data: mockUser() })

        const us = store.users.get(userId)
        store.currentUser = us

        await store.fetchDomainMutes()

        expect(mockFetch).to.have.been.calledWith(
          USER_API.MASTODON_DOMAIN_BLOCKS_URL,
          DEFAULT_OPTIONS('GET'),
        )

        expect(us.domainMutes).to.have.eql(
          new Set(['example.com', 'example.org']),
        )
      })

      it('fetchInLists', async () => {
        const inLists = [
          { exclusive: false, id: '1', title: 'Operatives' },
          { exclusive: true, id: '2', title: 'Agents' },
        ]
        const mockFetch = vi.fn().mockResolvedValueOnce(
          new Response(JSON.stringify(inLists), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        const store = useUsersStore()
        store.addNewUsers({
          timestamp: 1,
          data: [
            mockUser(),
            { ...mockUser({ name: 'John', screen_name: 'snake', id: '2' }) },
            { ...mockUser({ name: 'David Oh', screen_name: 'zero', id: '3' }) },
          ],
        })

        const us = store.users.get(userId)
        store.currentUser = us

        await store.fetchUserInLists('2')

        expect(mockFetch).to.have.been.calledWith(
          USER_API.MASTODON_USER_IN_LISTS('2'),
          DEFAULT_OPTIONS('GET'),
        )

        expect(store.users.get('2').inLists).to.have.eql(inLists)
      })
    })
  })

  describe('misc updates', () => {
    it('updateUserAdminData', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })
      const adminData = { is_active: true, tags: ['one', 'two'] }
      store.updateUserAdminData(userId, adminData)

      const userData = store.users.get(userId)
      expect(userData.deactivated).to.eql(false)
      expect(userData.tags).to.eql(new Set(['one', 'two']))
    })

    it('updateRight', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })
      store.updateRight(userId, 'right1', true)
      store.updateRight(userId, 'right2', false)

      const userData = store.users.get(userId)
      expect(userData.rights.right1).to.eql(true)
      expect(userData.rights.right2).to.eql(false)
    })

    it('clearFollowLists', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })
      const userData = store.users.get(userId)
      store.relationshipsLists.friends.get(userData).add('2')
      store.relationshipsLists.friends.get(userData).add('3')
      store.relationshipsLists.followers.get(userData).add('4')
      store.relationshipsLists.followers.get(userData).add('5')
      store.clearFollowLists(userId)

      expect(store.relationshipsLists.friends.get(userData)).to.have.length(0)
      expect(store.relationshipsLists.followers.get(userData)).to.have.length(0)
    })
  })

  describe('login/logout', () => {
    describe('login', () => {
      it('normal login', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValueOnce(
            new Response(JSON.stringify(mockMastoAPIUser()), {
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        )

        const spies = [
          // Misc initialization
          vi.spyOn(useSyncConfigStore(), 'initSyncConfig'),
          vi.spyOn(useUserHighlightStore(), 'initUserHighlight'),
          vi.spyOn(useInterfaceStore(), 'applyTheme'),
          vi.spyOn(useInterfaceStore(), 'onLogin'),
          vi.spyOn(useEmojiStore(), 'fetchEmoji'),

          // Timeline / Notifications
          vi.spyOn(useNotificationsStore(), 'activate'),
          vi.spyOn(useTimelinesStore(), 'activatePersistents'),

          // Fetchers
          vi.spyOn(useChatsStore(), 'startFetching'),
          vi.spyOn(useListsStore(), 'startFetching'),
          vi.spyOn(useAnnouncementsStore(), 'startFetching'),
          vi.spyOn(useBookmarkFoldersStore(), 'startFetching'),
          vi.spyOn(useStreamingStore(), 'initSocket'),
        ]

        spies.forEach((spy) => {
          spy.mockImplementation(async () => {
            /* no-op */
          })
        })

        useInstanceCapabilitiesStore().pleromaChatMessagesAvailable = true
        useMergedConfigStore().mergedConfig = { useStreamingApi: true }

        const store = useUsersStore()

        // Adding some users to verify they are getting cleaned afterwards
        store.addNewUsers({
          data: [
            mockUser(),
            { ...mockUser({ name: 'John', screen_name: 'snake' }) },
            { ...mockUser({ name: 'David Oh', screen_name: 'zero' }) },
          ],
          timestamp: 2000,
        })

        expect(store.loggedIn).to.eql(false)
        await store.loginUser('ACCESS_TOKEN')
        expect(store.loggedIn).to.eql(true)

        // We should be in the store ourselves
        expect(store.users).to.have.length(1)
        expect(store.usersByName).to.have.length(1)
        expect(store.usersByURL).to.have.length(1)
        expect(store.relationships).to.have.length(0)
        expect(store.lastLoginName).to.eql(userScreenName)
        spies.forEach((spy, index) => {
          expect(spy, `Spy ${index} has failed`).to.have.been.called
        })
      })

      it('bad credentials', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValueOnce(
            new Response(JSON.stringify(mockMastoAPIUser()), {
              status: 403,
              statusText: 'Forbidden',
              headers: { 'Content-Type': 'application/json' },
            }),
          ),
        )

        const spies = [vi.spyOn(useOAuthStore(), 'clearToken')]

        spies.forEach((spy) => {
          spy.mockImplementation(async () => {
            /* no-op */
          })
        })

        const store = useUsersStore()
        const exec = async () => {
          await store.loginUser('ACCESS_TOKEN')
        }

        await expect(exec).rejects.to.throw(Error)

        expect(store.loggedIn).to.eql(false)

        spies.forEach((spy, index) => {
          expect(spy, `Spy ${index} has failed`).to.have.been.called
        })
      })
    })

    describe('logout', () => {
      it('normal logout', async () => {
        const revokeApi = vi
          .fn()
          .mockResolvedValueOnce(
            // Ensure APP
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )
          .mockResolvedValueOnce(
            // Revoke Token
            new Response(JSON.stringify('ok'), {
              headers: { 'Content-Type': 'application/json' },
            }),
          )

        vi.stubGlobal('fetch', revokeApi)

        const spies = [
          // Misc initialization
          vi.spyOn(useStatusesStore(), 'resetStatuses'),
          vi.spyOn(useInterfaceStore(), 'onLogout'),

          // Timeline / Notifications
          vi.spyOn(useNotificationsStore(), 'deactivate'),
          vi.spyOn(useTimelinesStore(), 'deactivateAll'),

          // Fetchers
          vi.spyOn(useChatsStore(), 'resetChats'),
          vi.spyOn(useListsStore(), 'stopFetching'),
          vi.spyOn(useAnnouncementsStore(), 'stopFetching'),
          vi.spyOn(useBookmarkFoldersStore(), 'stopFetching'),
          vi.spyOn(useStreamingStore(), 'stopSocket'),
        ]

        spies.forEach((spy) => {
          spy.mockImplementation(async () => {
            /* no-op */
          })
        })

        useInstanceCapabilitiesStore().pleromaChatMessagesAvailable = true
        useMergedConfigStore().mergedConfig = { useStreamingApi: true }

        const store = useUsersStore()
        store.currentUser = mockUser()

        // Adding some users to verify they are getting cleaned afterwards
        store.addNewUsers({
          data: [
            mockUser(),
            {
              ...mockUser({ name: 'John', screen_name: 'snake' }),
              relationship: { id: userId, following: true },
            },
            { ...mockUser({ name: 'David Oh', screen_name: 'zero' }) },
          ],
          timestamp: 2000,
        })
        expect(store.loggedIn).to.eql(true)
        await store.logout()
        expect(store.loggedIn).to.eql(false)
        expect(store.lastLoginName).to.eql(null)
        expect(revokeApi).to.have.been.called
        expect(store.users).to.have.length(0)
        expect(store.usersByName).to.have.length(0)
        expect(store.usersByURL).to.have.length(0)
        expect(store.relationships).to.have.length(0)
        spies.forEach((spy, index) => {
          expect(spy, `Spy ${index} has failed`).to.have.been.called
        })
      })
    })
  })

  describe('actions', () => {
    describe('follow', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('instant follow case', async () => {
        const followApi = vi.fn().mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              id: userId,
              following: true,
              requested: true,
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )

        vi.stubGlobal('fetch', followApi)
        const store = useUsersStore()

        await store.followUser(userId)
        expect(followApi).to.have.been.called

        expect(store.followPollers).to.have.length(0)
        expect(store.followPollersAttempts).to.have.length(0)
        expect(followApi).to.have.been.calledWith(
          USER_API.MASTODON_FOLLOW_URL(userId),
          {
            body: '{}',
            ...DEFAULT_OPTIONS(),
          },
        )
      })

      it('delayed follow case', async () => {
        const followApi = vi
          .fn()
          .mockResolvedValueOnce(
            // Follow
            new Response(
              JSON.stringify({
                id: userId,
                following: false,
                requested: true,
              }),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )
          .mockResolvedValueOnce(
            // Check relationship
            new Response(
              JSON.stringify({
                id: userId,
                following: true,
                requested: true,
              }),
              {
                headers: { 'Content-Type': 'application/json' },
              },
            ),
          )

        vi.stubGlobal('fetch', followApi)

        const store = useUsersStore()

        await store.followUser(userId)
        expect(followApi).to.have.been.called

        expect(store.followPollers).to.have.length(1)
        expect(store.followPollersAttempts).to.have.length(1)
        expect(store.followPollersAttempts.get(userId)).to.eql(3)

        await vi.runAllTimersAsync()
        expect(followApi).to.have.been.called
        expect(store.followPollers).to.have.length(0)
        expect(store.followPollersAttempts).to.have.length(0)
      })

      it('unresolved follow case', async () => {
        const followApi = vi.fn().mockResolvedValueOnce(
          // Follow
          new Response(
            JSON.stringify({
              id: userId,
              following: false,
              requested: true,
            }),
            {
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        )

        followApi // mockImplementation because we need to re-create Response
          .mockImplementation(
            () =>
              // Check relationship
              new Response(
                JSON.stringify({
                  id: userId,
                  following: false,
                  requested: true,
                }),
                {
                  headers: { 'Content-Type': 'application/json' },
                },
              ),
          )

        vi.stubGlobal('fetch', followApi)

        const store = useUsersStore()

        await store.followUser(userId)
        expect(store.followPollers).to.have.length(1)
        expect(store.followPollersAttempts).to.have.length(1)
        expect(store.followPollersAttempts.get(userId)).to.eql(3)

        await vi.runAllTimersAsync()
        expect(store.followPollersAttempts.get(userId)).to.eql(2)

        await vi.runAllTimersAsync()
        expect(store.followPollersAttempts.get(userId)).to.eql(1)

        await vi.runAllTimersAsync()
        expect(store.followPollers).to.have.length(0)
        expect(store.followPollersAttempts).to.have.length(0)

        expect(followApi).to.have.callCount(4) // 1 follow + 3 retries
      })
    })

    it('unfollow', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: userId,
            following: false,
            requested: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      await store.unfollowUser(userId)

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_UNFOLLOW_URL(userId),
        DEFAULT_OPTIONS(),
      )
    })

    it('subscribe', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: userId,
            following: false,
            requested: true,
            subscribing: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      await store.subscribeUser(userId)

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_FOLLOW_URL(userId),
        {
          body: JSON.stringify({ notify: true }),
          ...DEFAULT_OPTIONS(),
        },
      )
    })

    it('unsubscribe', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: userId,
            following: false,
            requested: true,
            subscribing: false,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      await store.unsubscribeUser(userId)

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_FOLLOW_URL(userId),
        {
          body: JSON.stringify({ notify: false }),
          ...DEFAULT_OPTIONS(),
        },
      )
    })

    it('showReblogs', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: userId,
            following: false,
            requested: true,
            showing_reblogs: true,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      await store.showReblogs(userId)

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_FOLLOW_URL(userId),
        {
          body: JSON.stringify({ reblogs: true }),
          ...DEFAULT_OPTIONS(),
        },
      )
    })

    it('hideReblogs', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: userId,
            following: false,
            requested: true,
            showing_reblogs: false,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      await store.hideReblogs(userId)

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_FOLLOW_URL(userId),
        {
          body: JSON.stringify({ reblogs: false }),
          ...DEFAULT_OPTIONS(),
        },
      )
    })

    it.each([
      'unmute',
      'unblock',
      'removeUserFromFollowers',
    ])('%s', async (action) => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ id: userId }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      const { storeAction, apiUrl } = actionKeys(action)
      await store[storeAction](userId)
      console.log(apiUrl)

      expect(mockFetch).to.have.been.calledWith(
        USER_API[apiUrl](userId),
        DEFAULT_OPTIONS(),
      )
    })

    describe.each(['mute', 'block'])('%s', (action) => {
      it('normal', async () => {
        const mockFetch = vi.fn().mockResolvedValueOnce(
          new Response(JSON.stringify({ id: userId }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        vi.spyOn(useStatusesStore(), 'wipeUserStatuses').mockImplementation(
          async () => {
            /* no-op */
          },
        )

        vi.spyOn(useTimelinesStore(), 'wipeUserStatuses').mockImplementation(
          async () => {
            /* no-op */
          },
        )

        const store = useUsersStore()
        const { storeAction, apiUrl } = actionKeys(action)
        await store[storeAction](userId)

        expect(mockFetch).to.have.been.calledWith(USER_API[apiUrl](userId), {
          body: '{}',
          ...DEFAULT_OPTIONS(),
        })
      })

      it('with expiration', async () => {
        const mockFetch = vi.fn().mockResolvedValueOnce(
          new Response(JSON.stringify({ id: userId }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

        vi.stubGlobal('fetch', mockFetch)

        vi.spyOn(useStatusesStore(), 'wipeUserStatuses').mockImplementation(
          async () => {
            /* no-op */
          },
        )

        vi.spyOn(useTimelinesStore(), 'wipeUserStatuses').mockImplementation(
          async () => {
            /* no-op */
          },
        )

        const store = useUsersStore()
        const { storeAction, apiUrl } = actionKeys(action)
        await store[storeAction](userId, 20)
        const argument = action === 'mute' ? 'expires_in' : 'duration'

        expect(mockFetch).to.have.been.calledWith(USER_API[apiUrl](userId), {
          body: `{"${argument}":20}`,
          ...DEFAULT_OPTIONS(),
        })
      })
    })

    it.each(['mute', 'unmute'])('%s domain', async (action) => {
      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ id: userId }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )

      vi.stubGlobal('fetch', mockFetch)

      const store = useUsersStore()
      store.currentUser = mockUser()
      store.currentUser.domainMutes = new Set()
      if (action === 'unmute') {
        store.currentUser.domainMutes.add('example.com')
      }
      await store[action + 'Domain']('example.com')

      expect(mockFetch).to.have.been.calledWith(
        USER_API.MASTODON_DOMAIN_BLOCKS_URL,
        {
          body: JSON.stringify({ domain: 'example.com' }),
          ...DEFAULT_OPTIONS(action === 'mute' ? 'POST' : 'DELETE'),
        },
      )

      if (action === 'mute') {
        expect(store.currentUser.domainMutes).to.include('example.com')
      } else {
        expect(store.currentUser.domainMutes).to.not.include('example.com')
      }
    })

    it.each([
      'muteDomain',
      'unmuteDomain',
      'muteUser',
      'unmuteUser',
      'blockUser',
      'unblockUser',
    ])('%ss', async (action) => {
      const store = useUsersStore()
      store[action] = vi.fn().mockResolvedValue(async () => {
        /* no-op */
      })
      store[action + 's'](['1', '2', '3'])
      expect(store[action]).to.have.been.calledWith('1')
      expect(store[action]).to.have.been.calledWith('2')
      expect(store[action]).to.have.been.calledWith('3')
    })
  })

  describe('getters', () => {
    it('relationship returns a placeholder if relationship info is missing', () => {
      const store = useUsersStore()

      expect(store.relationship(userId)).to.eql({ id: userId, loading: true })
    })

    it('relationship returns a placeholder if relationship info is missing while user is present', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })

      expect(store.relationship(userId)).to.eql({ id: userId, loading: true })
    })

    it('findUser returns user with matching id', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })

      expect(store.findUser(userId).id).to.eql(userId)
    })

    it('findUserByName returns user with matching screen_name', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })

      expect(store.findUserByName(mockUser().screen_name).id).to.eql(userId)
    })

    it('findUserByName returns user with matching url', () => {
      const store = useUsersStore()
      store.addNewUsers({ data: [mockUser()], timestamp: 1 })

      expect(store.findUserByUrl(mockUser().url).id).to.eql(userId)
    })
  })
})
