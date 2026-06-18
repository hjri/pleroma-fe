import { createTestingPinia } from '@pinia/testing'
import { HttpResponse, http } from 'msw'
import { setActivePinia } from 'pinia'

import { test as it } from '/test/fixtures/mock_api.js'

import { useListsStore } from 'src/stores/lists.js'

import { MASTODON_LIST_ACCOUNTS_URL, MASTODON_LIST_URL } from 'src/api/user.js'

describe('The lists store', () => {
  let store

  beforeEach(() => {
    createTestingPinia({ stubActions: false })
    store = useListsStore()
  })

  describe('actions', () => {
    it('updates array of all lists', () => {
      const list = { id: '1', title: 'testList' }

      store.setLists([list])
      expect(store.allLists).to.have.length(1)
      expect(store.allLists).to.eql([list])
    })

    it('adds a new list with a title, updating the title for existing lists', async ({
      worker,
    }) => {
      const list = { id: '1', title: 'testList' }
      const modList = { id: '1', title: 'anotherTestTitle' }

      worker.use(
        http.put(MASTODON_LIST_URL(':id'), () =>
          HttpResponse.json({ ok: true }),
        ),
      )
      console.log('1 =========', worker.listHandlers())

      await store.setList({ listId: list.id, title: list.title })
      expect(store.allListsObject[list.id]).to.eql({
        title: list.title,
        accountIds: [],
      })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(list)

      console.log('2 =========', worker.listHandlers())

      await store.setList({ listId: modList.id, title: modList.title })
      expect(store.allListsObject[modList.id]).to.eql({
        title: modList.title,
        accountIds: [],
      })
      expect(store.allLists).to.have.length(1)
      expect(store.allLists[0]).to.eql(modList)

      console.log('3 =========', worker.listHandlers())
    })

    it('adds a new list with an array of IDs, updating the IDs for existing lists', async ({
      worker,
    }) => {
      const list = { id: '1', accountIds: ['1', '2', '3'] }
      const modList = { id: '1', accountIds: ['3', '4', '5'] }

      worker.use(
        http.post(MASTODON_LIST_ACCOUNTS_URL(':id'), () =>
          HttpResponse.json({ ok: true }),
        ),
        http.delete(MASTODON_LIST_ACCOUNTS_URL(':id'), () =>
          HttpResponse.json({ ok: true }),
        ),
      )

      await store.setListAccounts({
        listId: list.id,
        accountIds: list.accountIds,
      })
      expect(store.allListsObject[list.id].accountIds).to.eql(list.accountIds)

      await store.setListAccounts({
        listId: modList.id,
        accountIds: modList.accountIds,
      })

      expect(store.allListsObject[modList.id].accountIds).to.eql(
        modList.accountIds,
      )
    })

    it('deletes a list', async ({ worker }) => {
      store.$patch({
        allLists: [{ id: '1', title: 'testList' }],
        allListsObject: {
          1: { title: 'testList', accountIds: ['1', '2', '3'] },
        },
      })
      const listId = '1'

      worker.use(
        http.delete(MASTODON_LIST_URL(':id'), () =>
          HttpResponse.json({ ok: true }),
        ),
      )

      await store.deleteList({ listId })
      expect(store.allLists).to.have.length(0)
      expect(store.allListsObject).to.eql({})
    })
  })

  describe('getters', () => {
    it('returns list title', () => {
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
