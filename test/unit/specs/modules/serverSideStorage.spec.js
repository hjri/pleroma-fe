import { cloneDeep } from 'lodash'
import { setActivePinia, createPinia } from 'pinia'

import {
  VERSION,
  COMMAND_TRIM_FLAGS,
  COMMAND_TRIM_FLAGS_AND_RESET,
  _moveItemInArray,
  _getRecentData,
  _getAllFlags,
  _mergeFlags,
  _mergePrefs,
  _resetFlags,
  defaultState,
  newUserFlags,
  useServerSideStorageStore,
} from 'src/stores/serverSideStorage.js'

describe('The serverSideStorage module', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('mutations', () => {
    describe('setServerSideStorage', () => {
      const user = {
        created_at: new Date('1999-02-09'),
        storage: {}
      }

      it('should initialize storage if none present', () => {
        const store = useServerSideStorageStore()
        store.setServerSideStorage(store, user)
        expect(store.cache._version).to.eql(VERSION)
        expect(store.cache._timestamp).to.be.a('number')
        expect(store.cache.flagStorage).to.eql(defaultState.flagStorage)
        expect(store.cache.prefsStorage).to.eql(defaultState.prefsStorage)
      })

      it('should initialize storage with proper flags for new users if none present', () => {
        const store = useServerSideStorageStore()
        store.setServerSideStorage({ ...user, created_at: new Date() })
        expect(store.cache._version).to.eql(VERSION)
        expect(store.cache._timestamp).to.be.a('number')
        expect(store.cache.flagStorage).to.eql(newUserFlags)
        expect(store.cache.prefsStorage).to.eql(defaultState.prefsStorage)
      })

      it('should merge flags even if remote timestamp is older', () => {
        const store = useServerSideStorageStore()
        store.cache = {
          _timestamp: Date.now(),
          _version: VERSION,
          ...cloneDeep(defaultState)
        }

        store.setServerSideStorage(
          {
            ...user,
            storage: {
              _timestamp: 123,
              _version: VERSION,
              flagStorage: {
                ...defaultState.flagStorage,
                updateCounter: 1
              },
              prefsStorage: {
                ...defaultState.prefsStorage
              }
            }
          }
        )

        expect(store.cache.flagStorage).to.eql({
          ...defaultState.flagStorage,
          updateCounter: 1
        })
      })

      it('should reset local timestamp to remote if contents are the same', () => {
        const store = useServerSideStorageStore()
        store.cache = null

        store.setServerSideStorage(
          {
            ...user,
            storage: {
              _timestamp: 123,
              _version: VERSION,
              flagStorage: {
                ...defaultState.flagStorage,
                updateCounter: 999
              }
            }
          }
        )
        expect(store.cache._timestamp).to.eql(123)
        expect(store.flagStorage.updateCounter).to.eql(999)
        expect(store.cache.flagStorage.updateCounter).to.eql(999)
      })

      it('should remote version if local missing', () => {
        const store = useServerSideStorageStore()
        store.setServerSideStorage(store, user)
        expect(store.cache._version).to.eql(VERSION)
        expect(store.cache._timestamp).to.be.a('number')
        expect(store.cache.flagStorage).to.eql(defaultState.flagStorage)
      })
    })
    describe('setPreference', () => {
      it('should set preference and update journal log accordingly', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.testing', value: 1 })
        expect(store.prefsStorage.simple.testing).to.eql(1)
        expect(store.prefsStorage._journal.length).to.eql(1)
        expect(store.prefsStorage._journal[0]).to.eql({
          path: 'simple.testing',
          operation: 'set',
          args: [1],
          // should have A timestamp, we don't really care what it is
          timestamp: store.prefsStorage._journal[0].timestamp
        })
      })

      it('should keep journal to a minimum', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.testing', value: 1 })
        store.setPreference({ path: 'simple.testing', value: 2 })
        store.addCollectionPreference({ path: 'collections.testing', value: 2 })
        store.removeCollectionPreference({ path: 'collections.testing', value: 2 })
        store.updateCache({ username: 'test' })
        expect(store.prefsStorage.simple.testing).to.eql(2)
        expect(store.prefsStorage.collections.testing).to.eql([])
        expect(store.prefsStorage._journal.length).to.eql(2)
        expect(store.prefsStorage._journal[0]).to.eql({
          path: 'simple.testing',
          operation: 'set',
          args: [2],
          // should have A timestamp, we don't really care what it is
          timestamp: store.prefsStorage._journal[0].timestamp
        })
        expect(store.prefsStorage._journal[1]).to.eql({
          path: 'collections.testing',
          operation: 'removeFromCollection',
          args: [2],
          // should have A timestamp, we don't really care what it is
          timestamp: store.prefsStorage._journal[1].timestamp
        })
      })

      it('should remove duplicate entries from journal', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.testing', value: 1 })
        store.setPreference({ path: 'simple.testing', value: 1 })
        store.addCollectionPreference({ path: 'collections.testing', value: 2 })
        store.addCollectionPreference({ path: 'collections.testing', value: 2 })
        store.updateCache({ username: 'test' })
        expect(store.prefsStorage.simple.testing).to.eql(1)
        expect(store.prefsStorage.collections.testing).to.eql([2])
        expect(store.prefsStorage._journal.length).to.eql(2)
      })

      it('should remove depth = 3 set/unset entries from journal', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.object.foo', value: 1 })
        store.unsetPreference({ path: 'simple.object.foo' })
        store.updateCache(store, { username: 'test' })
        expect(store.prefsStorage.simple.object).to.not.have.property('foo')
        expect(store.prefsStorage._journal.length).to.eql(1)
      })

      it('should not allow unsetting depth <= 2', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.object.foo', value: 1 })
        expect(() => store.unsetPreference({ path: 'simple' })).to.throw()
        expect(() => store.unsetPreference({ path: 'simple.object' })).to.throw()
      })

      it('should not allow (un)setting depth > 3', () => {
        const store = useServerSideStorageStore()
        store.setPreference({ path: 'simple.object', value: {} })
        expect(() => store.setPreference({ path: 'simple.object.lv3', value: 1 })).to.not.throw()
        expect(() => store.setPreference({ path: 'simple.object.lv3.lv4', value: 1})).to.throw()
        expect(() => store.unsetPreference({ path: 'simple.object.lv3', value: 1 })).to.not.throw()
        expect(() => store.unsetPreference({ path: 'simple.object.lv3.lv4', value: 1})).to.throw()
      })
    })
  })

  describe('helper functions', () => {
    describe('_moveItemInArray', () => {
      it('should move item according to movement value', () => {
        expect(_moveItemInArray([1, 2, 3, 4], 4, -1)).to.eql([1, 2, 4, 3])
        expect(_moveItemInArray([1, 2, 3, 4], 1, 2)).to.eql([2, 3, 1, 4])
      })
      it('should clamp movement to within array', () => {
        expect(_moveItemInArray([1, 2, 3, 4], 4, -10)).to.eql([4, 1, 2, 3])
        expect(_moveItemInArray([1, 2, 3, 4], 3, 99)).to.eql([1, 2, 4, 3])
      })
    })
    describe('_getRecentData', () => {
      it('should handle nulls correctly', () => {
        expect(_getRecentData(null, null, true)).to.eql({ recent: null, stale: null, needUpload: true })
      })

      it('doesn\'t choke on invalid data', () => {
        expect(_getRecentData({ a: 1 }, { b: 2 }, true)).to.eql({ recent: null, stale: null, needUpload: true })
      })

      it('should prefer the valid non-null correctly, needUpload works properly', () => {
        const nonNull = { _version: VERSION, _timestamp: 1 }
        expect(_getRecentData(nonNull, null, true)).to.eql({ recent: nonNull, stale: null, needUpload: true })
        expect(_getRecentData(null, nonNull, true)).to.eql({ recent: nonNull, stale: null, needUpload: false })
      })

      it('should prefer the one with higher timestamp', () => {
        const a = { _version: VERSION, _timestamp: 1 }
        const b = { _version: VERSION, _timestamp: 2 }

        expect(_getRecentData(a, b, true)).to.eql({ recent: b, stale: a, needUpload: false })
        expect(_getRecentData(b, a, true)).to.eql({ recent: b, stale: a, needUpload: false })
      })

      it('case where both are same', () => {
        const a = { _version: VERSION, _timestamp: 3 }
        const b = { _version: VERSION, _timestamp: 3 }

        expect(_getRecentData(a, b, true)).to.eql({ recent: b, stale: a, needUpload: false })
        expect(_getRecentData(b, a, true)).to.eql({ recent: b, stale: a, needUpload: false })
      })
    })

    describe('_getAllFlags', () => {
      it('should handle nulls properly', () => {
        expect(_getAllFlags(null, null)).to.eql([])
      })
      it('should output list of keys if passed single object', () => {
        expect(_getAllFlags({ flagStorage: { a: 1, b: 1, c: 1 } }, null)).to.eql(['a', 'b', 'c'])
      })
      it('should union keys of both objects', () => {
        expect(_getAllFlags({ flagStorage: { a: 1, b: 1, c: 1 } }, { flagStorage: { c: 1, d: 1 } })).to.eql(['a', 'b', 'c', 'd'])
      })
    })

    describe('_mergeFlags', () => {
      it('should handle merge two flag sets correctly picking higher numbers', () => {
        expect(
          _mergeFlags(
            { flagStorage: { a: 0, b: 3 } },
            { flagStorage: { b: 1, c: 4, d: 9 } },
            ['a', 'b', 'c', 'd'])
        ).to.eql({ a: 0, b: 3, c: 4, d: 9 })
      })
    })

    describe('_mergePrefs', () => {
      it('should prefer recent and apply journal to it', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              simple: { a: 1, b: 0, c: true },
              _journal: [
                { path: 'simple.b', operation: 'set', args: [0], timestamp: 2 },
                { path: 'simple.c', operation: 'set', args: [true], timestamp: 4 }
              ]
            },
            // STALE
            {
              simple: { a: 1, b: 1, c: false },
              _journal: [
                { path: 'simple.a', operation: 'set', args: [1], timestamp: 1 },
                { path: 'simple.b', operation: 'set', args: [1], timestamp: 3 }
              ]
            }
          )
        ).to.eql({
          simple: { a: 1, b: 1, c: true },
          _journal: [
            { path: 'simple.a', operation: 'set', args: [1], timestamp: 1 },
            { path: 'simple.b', operation: 'set', args: [1], timestamp: 3 },
            { path: 'simple.c', operation: 'set', args: [true], timestamp: 4 }
          ]
        })
      })

      it('should allow setting falsy values', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              simple: { a: 1, b: 0, c: false },
              _journal: [
                { path: 'simple.b', operation: 'set', args: [0], timestamp: 2 },
                { path: 'simple.c', operation: 'set', args: [false], timestamp: 4 }
              ]
            },
            // STALE
            {
              simple: { a: 0, b: 0, c: true },
              _journal: [
                { path: 'simple.a', operation: 'set', args: [0], timestamp: 1 },
                { path: 'simple.b', operation: 'set', args: [0], timestamp: 3 }
              ]
            }
          )
        ).to.eql({
          simple: { a: 0, b: 0, c: false },
          _journal: [
            { path: 'simple.a', operation: 'set', args: [0], timestamp: 1 },
            { path: 'simple.b', operation: 'set', args: [0], timestamp: 3 },
            { path: 'simple.c', operation: 'set', args: [false], timestamp: 4 }
          ]
        })
      })

      it('should work with strings', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              simple: { a: 'foo' },
              _journal: [
                { path: 'simple.a', operation: 'set', args: ['foo'], timestamp: 2 }
              ]
            },
            // STALE
            {
              simple: { a: 'bar' },
              _journal: [
                { path: 'simple.a', operation: 'set', args: ['bar'], timestamp: 4 }
              ]
            }
          )
        ).to.eql({
          simple: { a: 'bar' },
          _journal: [
            { path: 'simple.a', operation: 'set', args: ['bar'], timestamp: 4 }
          ]
        })
      })

      it('should work with objects', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              simple: { lv2: { lv3: 'foo' } },
              _journal: [
                { path: 'simple.lv2.lv3', operation: 'set', args: ['foo'], timestamp: 2 }
              ]
            },
            // STALE
            {
              simple: { lv2: { lv3: 'bar' } },
              _journal: [
                { path: 'simple.lv2.lv3', operation: 'set', args: ['bar'], timestamp: 4 }
              ]
            }
          )
        ).to.eql({
          simple: { lv2: { lv3: 'bar' } },
          _journal: [
            { path: 'simple.lv2.lv3', operation: 'set', args: ['bar'], timestamp: 4 }
          ]
        })
      })

      it('should work with unset', () => {
        expect(
          _mergePrefs(
            // RECENT
            {
              simple: { lv2: { lv3: 'foo' } },
              _journal: [
                { path: 'simple.lv2.lv3', operation: 'set', args: ['foo'], timestamp: 2 }
              ]
            },
            // STALE
            {
              simple: { lv2: {} },
              _journal: [
                { path: 'simple.lv2.lv3', operation: 'unset', args: [], timestamp: 4 }
              ]
            }
          )
        ).to.eql({
          simple: { lv2: {} },
          _journal: [
            { path: 'simple.lv2.lv3', operation: 'unset', args: [], timestamp: 4 }
          ]
        })
      })
    })

    describe('_resetFlags', () => {
      it('should reset all known flags to 0 when reset flag is set to > 0 and < 9000', () => {
        const totalFlags = { a: 0, b: 3, reset: 1 }

        expect(_resetFlags(totalFlags)).to.eql({ a: 0, b: 0, reset: 0 })
      })
      it('should trim all flags to known when reset is set to 1000', () => {
        const totalFlags = { a: 0, b: 3, c: 33, reset: COMMAND_TRIM_FLAGS }

        expect(_resetFlags(totalFlags, { a: 0, b: 0, reset: 0 })).to.eql({ a: 0, b: 3, reset: 0 })
      })
      it('should trim all flags to known and reset when reset is set to 1001', () => {
        const totalFlags = { a: 0, b: 3, c: 33, reset: COMMAND_TRIM_FLAGS_AND_RESET }

        expect(_resetFlags(totalFlags, { a: 0, b: 0, reset: 0 })).to.eql({ a: 0, b: 0, reset: 0 })
      })
    })
  })
})
