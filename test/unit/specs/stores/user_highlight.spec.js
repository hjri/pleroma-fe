import { cloneDeep } from 'lodash'
import { createPinia, setActivePinia } from 'pinia'

import {
  _getRecentData,
  _mergePrefs,
  _moveItemInArray,
  useUserHighlightStore,
} from 'src/stores/user_highlight.js'

describe('The UserHighlight store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('mutations', () => {
    describe('initUserHighlight', () => {
      const user = {
        created_at: new Date('1999-02-09'),
        storage: {},
      }

      it('should initialize storage if none present', () => {
        const store = useUserHighlightStore()
        store.initUserHighlight({ ...user })
        expect(store.cache._timestamp).to.be.a('number')
        expect(store.cache.highlight).to.eql({ _journal: [] })
      })

      it('should initialize storage for new users if none present', () => {
        const store = useUserHighlightStore()
        store.initUserHighlight({ ...user, created_at: new Date() })
        expect(store.cache._timestamp).to.be.a('number')
        expect(store.cache.highlight).to.eql({ _journal: [] })
      })

      it('should use remote version if local missing', () => {
        const store = useUserHighlightStore()
        store.initUserHighlight(store, user)
        expect(store.cache._timestamp).to.be.a('number')
      })
    })
    describe('set', () => {
      it('should set preference and update journal log accordingly', () => {
        const store = useUserHighlightStore()
        store.set({ user: 'highlight@testing', value: { type: 'test' }})
        expect(store.highlight['highlight@testing']).to.eql({ user: 'highlight@testing', type: 'test' })
        expect(store.highlight._journal.length).to.eql(1)
        expect(store.highlight._journal[0]).to.eql({
          user: 'highlight@testing',
          operation: 'set',
          args: [{ user: 'highlight@testing', type: 'test' }],
          // should have A timestamp, we don't really care what it is
          timestamp: store.highlight._journal[0].timestamp,
        })
      })

      it('should keep journal to a minimum', () => {
        const store = useUserHighlightStore()
        store.set({ user: 'highlight@testing.xyz', value: { type: 'test' } })
        store.set({ user: 'highlight@testing.xyz', value: { type: 'test' } })
        store.updateCache({ username: 'test' })
        expect(store.highlight['highlight@testing.xyz']).to.eql({ user: 'highlight@testing.xyz', type: 'test' })
        expect(store.highlight._journal.length).to.eql(1)
        expect(store.highlight._journal[0]).to.eql({
          user: 'highlight@testing.xyz',
          operation: 'set',
          args: [{
            user: 'highlight@testing.xyz',
            type: 'test',
          }],
          // should have A timestamp, we don't really care what it is
          timestamp: store.highlight._journal[0].timestamp,
        })
      })

      it('should remove duplicate entries from journal', () => {
        const store = useUserHighlightStore()
        store.set({ user: 'a@test.xyz', value: { type: 'foo' } })
        store.set({ user: 'a@test.xyz', value: { type: 'foo' } })
        store.updateCache({ username: 'test' })
        expect(store.highlight['a@test.xyz']).to.eql({ user: 'a@test.xyz', type: 'foo' })
        expect(store.highlight._journal.length).to.eql(1)
      })
    })
  })

  describe('helper functions', () => {
    describe('_getRecentData', () => {
      it('should handle nulls correctly', () => {
        expect(_getRecentData(null, null, true)).to.eql({
          recent: null,
          stale: null,
          needUpload: true,
        })
      })

      it("doesn't choke on invalid data", () => {
        expect(_getRecentData({ a: 1 }, { b: 2 }, true)).to.eql({
          recent: null,
          stale: null,
          needUpload: true,
        })
      })

      it('should prefer the valid non-null correctly, needUpload works properly', () => {
        const nonNull = { _timestamp: 1 }
        expect(_getRecentData(nonNull, null, true)).to.eql({
          recent: nonNull,
          stale: null,
          needUpload: true,
        })
        expect(_getRecentData(null, nonNull, true)).to.eql({
          recent: nonNull,
          stale: null,
          needUpload: false,
        })
      })

      it('should prefer the one with higher timestamp', () => {
        const a = { _timestamp: 1 }
        const b = { _timestamp: 2 }

        expect(_getRecentData(a, b, true)).to.eql({
          recent: b,
          stale: a,
          needUpload: false,
        })
        expect(_getRecentData(b, a, true)).to.eql({
          recent: b,
          stale: a,
          needUpload: false,
        })
      })

      it('case where both are same', () => {
        const a = { _timestamp: 3 }
        const b = { _timestamp: 3 }

        expect(_getRecentData(a, b, true)).to.eql({
          recent: b,
          stale: a,
          needUpload: false,
        })
        expect(_getRecentData(b, a, true)).to.eql({
          recent: b,
          stale: a,
          needUpload: false,
        })
      })
    })

    describe('_mergePrefs', () => {
      it('should prefer recent and apply journal to it', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              highlight: { 'a@test.xyz': 1, 'b@test.xyz': 0, 'c@test.xyz': true },
              _journal: [
                {
                  user: 'b@test.xyz',
                  operation: 'set',
                  args: [0],
                  timestamp: 2,
                },
                {
                  user: 'c@test.xyz',
                  operation: 'set',
                  args: [true],
                  timestamp: 4,
                },
              ],
            },
            // STALE
            {
              highlight: { 'a@test.xyz': 1, 'b@test.xyz': 1, 'c@test.xyz': false },
              _journal: [
                {
                  user: 'a@test.xyz',
                  operation: 'set',
                  args: [1],
                  timestamp: 1,
                },
                {
                  user: 'b@test.xyz',
                  operation: 'set',
                  args: [1],
                  timestamp: 3,
                },
              ],
            },
          ),
        ).to.eql({
          highlight: { 'a@test.xyz': 1, 'b@test.xyz': 1, 'c@test.xyz': true },
          _journal: [
            { user: 'a@test.xyz', operation: 'set', args: [1], timestamp: 1 },
            { user: 'b@test.xyz', operation: 'set', args: [1], timestamp: 3 },
            {
              user: 'c@test.xyz',
              operation: 'set',
              args: [true],
              timestamp: 4,
            },
          ],
        })
      })

      it('should work with objects', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              highlight: { 'a@test.xyz': { type: 'foo' } },
              _journal: [
                {
                  user: 'a@test.xyz',
                  operation: 'set',
                  args: [{ type: 'foo' }],
                  timestamp: 2,
                },
              ],
            },
            // STALE
            {
              highlight: { 'a@test.xyz': { type: 'bar' } },
              _journal: [
                {
                  user: 'a@test.xyz',
                  operation: 'set',
                  args: [{ type: 'bar' }],
                  timestamp: 4,
                },
              ],
            },
          ),
        ).to.eql({
          highlight: { 'a@test.xyz': { type: 'bar' } },
          _journal: [
            {
              user: 'a@test.xyz',
              operation: 'set',
              args: [{ type: 'bar' }],
              timestamp: 4,
            },
          ],
        })
      })

      it('should work with unset', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              highlight: { 'a@test.xyz': { type: 'foo' } },
              _journal: [
                {
                  user: 'a@test.xyz',
                  operation: 'set',
                  args: [{ type: 'foo' }],
                  timestamp: 2,
                },
              ],
            },
            // STALE
            {
              highlight: {},
              _journal: [
                {
                  user: 'a@test.xyz',
                  operation: 'unset',
                  args: [],
                  timestamp: 4,
                },
              ],
            },
          ),
        ).to.eql({
          highlight: {},
          _journal: [
            {
              user: 'a@test.xyz',
              operation: 'unset',
              args: [],
              timestamp: 4,
            },
          ],
        })
      })
    })
  })
})
