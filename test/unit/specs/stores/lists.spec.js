import { createTestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'

import { useListsStore } from 'src/stores/lists.js'

import { MASTODON_LIST_ACCOUNTS_URL, MASTODON_LIST_URL } from 'src/api/user.js'

describe('The lists store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  describe('actions', () => {
    it('updates array of all lists', () => {
      const store = useListsStore()
      const list = { id: '1', title: 'testList' }

      store.setLists([list])
      expect(store.allLists).to.have.length(1)
      expect(store.allLists).to.eql([list])
    })

    it('adds a new list with a title, updating the title for existing lists', async () => {
      const store = useListsStore()
      const list = { id: '1', title: 'testList' }
      const modList = { id: '1', title: 'anotherTestTitle' }

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )

      vi.stubGlobal('fetch', mockFetch)

      await store.setList({ listId: list.id, title: list.title })

      expect(mockFetch).to.have.been.calledOnce
      expect(mockFetch.mock.calls[0][0]).to.eql(MASTODON_LIST_URL('1'))
      expect(mockFetch.mock.calls[0][1]).to.have.property('method', 'PUT')
      mockFetch.mockClear()

      expect(store.allListsObject[list.id]).to.eql({
        title: list.title,
        accountIds: [],
      })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(list)

      await store.setList({ listId: modList.id, title: modList.title })

      expect(mockFetch).to.have.been.calledOnce
      expect(mockFetch.mock.calls[0][0]).to.eql(MASTODON_LIST_URL('1'))
      expect(mockFetch.mock.calls[0][1]).to.have.property('method', 'PUT')

      expect(store.allListsObject[modList.id]).to.eql({
        title: modList.title,
        accountIds: [],
      })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(modList)
    })

    it('adds a new list with an array of IDs, updating the IDs for existing lists', async () => {
      const store = useListsStore()
      const list = { id: '1', accountIds: ['1', '2', '3'] }
      const modList = { id: '1', accountIds: ['3', '4', '5'] }

      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      vi.stubGlobal('fetch', mockFetch)

      await store.setListAccounts({
        listId: list.id,
        accountIds: list.accountIds,
      })
      expect(mockFetch).to.have.been.calledOnce
      expect(mockFetch.mock.calls[0][0]).to.eql(MASTODON_LIST_ACCOUNTS_URL('1'))
      expect(mockFetch.mock.calls[0][1]).to.have.property('method', 'POST')
      mockFetch.mockClear()

      expect(store.allListsObject[list.id].accountIds).to.eql(list.accountIds)

      await store.setListAccounts({
        listId: modList.id,
        accountIds: modList.accountIds,
      })

      expect(mockFetch).to.have.been.calledTwice
      expect(mockFetch.mock.calls[0][0]).to.eql(MASTODON_LIST_ACCOUNTS_URL('1'))
      expect(mockFetch.mock.calls[0][1]).to.have.property('method', 'POST')
      expect(mockFetch.mock.calls[1][0]).to.eql(MASTODON_LIST_ACCOUNTS_URL('1'))
      expect(mockFetch.mock.calls[1][1]).to.have.property('method', 'DELETE')

      expect(store.allListsObject[modList.id].accountIds).to.eql(
        modList.accountIds,
      )
    })

    it('deletes a list', async () => {
      const store = useListsStore()
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] },
        },
      })
      const listId = '1'

      const mockFetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', mockFetch)

      await store.deleteList({ listId })
      expect(store.allLists).to.have.length(0)
      expect(store.allListsObject).to.eql({})
    })
  })

  describe('getters', () => {
    it('returns list title', () => {
      const store = useListsStore()
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] },
        },
      })
      const id = '1'

      expect(store.findListTitle(id)).to.eql('testList')
    })

    it('returns list accounts', () => {
      const store = useListsStore()
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] },
        },
      })
      const id = '1'

      expect(store.findListAccounts(id)).to.eql(['1', '2', '3'])
    })
  })
})
