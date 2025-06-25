import { setActivePinia, createPinia, defineStore } from 'pinia'
import { createApp } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { piniaPersistPlugin } from 'src/lib/persisted_state.js'

const app = createApp({})

const getMockStorage = () => {
  let state = {}

  return {
    getItem: vi.fn(async key => {
      console.log('get:', key, state[key])
      return state[key]
    }),
    setItem: vi.fn(async (key, value) => {
      console.log('set:', key, value)
      state[key] = value
    }),
    _clear: () => {
      state = {}
    }
  }
}

let mockStorage

beforeEach(() => {
  mockStorage = getMockStorage()
  const pinia = createPinia().use(piniaPersistPlugin({ storage: mockStorage }))
  app.use(pinia)
  setActivePinia(pinia)
})

describe('piniaPersistPlugin', () => {
  describe('initial state', () => {
    test('it does not load anything if it is not enabled', async () => {
      await mockStorage.setItem('pinia-local-test', { a: 3 })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 })
      })

      const test = useTestStore()
      await test.$persistLoaded
      expect(test.a).to.eql(1)
      expect(test.b).to.eql(2)
    })

    test('$persistLoaded rejects if getItem() throws', async () => {
      const error = new Error('unable to get storage')
      mockStorage.getItem = vi.fn(async () => {
        throw error
      })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2, c: { d: 4, e: 5 } }),
        persist: {}
      })

      const test = useTestStore()
      await expect(test.$persistLoaded).rejects.toThrowError(error)
    })

    test('it loads from pinia storage', async () => {
      await mockStorage.setItem('pinia-local-test', { a: 3, c: { d: 0 } })
      await mockStorage.setItem('vuex-lz', { test: { a: 4 } })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2, c: { d: 4, e: 5 } }),
        persist: {}
      })

      const test = useTestStore()
      await test.$persistLoaded
      expect(test.a).to.eql(3)
      expect(test.b).to.eql(2)
      expect(test.c.d).to.eql(0)
      expect(test.c.e).to.eql(5)
    })

    test('it loads from vuex storage as fallback', async () => {
      await mockStorage.setItem('vuex-lz', { test: { a: 4, c: { d: 0 } } })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2, c: { d: 4, e: 5 } }),
        persist: {}
      })

      const test = useTestStore()
      await test.$persistLoaded
      expect(test.a).to.eql(4)
      expect(test.b).to.eql(2)
      expect(test.c.d).to.eql(0)
      expect(test.c.e).to.eql(5)
    })

    test('it loads from vuex storage and writes it into pinia storage', async () => {
      await mockStorage.setItem('vuex-lz', { test: { a: 4, c: { d: 0 } } })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2, c: { d: 4, e: 5 } }),
        persist: {
          afterLoad (state) {
            return {
              ...state,
              a: 5
            }
          }
        }
      })

      const test = useTestStore()
      await test.$persistLoaded
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 4, c: { d: 0 } })
      expect(test.a).to.eql(5)
      expect(test.b).to.eql(2)
      expect(test.c.d).to.eql(0)
      expect(test.c.e).to.eql(5)
    })

    test('it does not modify state if there is nothing to load', async () => {
      await mockStorage.setItem('vuex-lz', { test2: { a: 4 } })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {}
      })

      const test = useTestStore()
      await test.$persistLoaded
      expect(test.a).to.eql(1)
      expect(test.b).to.eql(2)
    })
  })

  describe('paths', () => {
    test('it saves everything if paths is unspecified', async () => {
      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {}
      })

      const test = useTestStore()
      await test.$persistLoaded
      test.$patch({ a: 3 })
      await flushPromises()
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 3, b: 2 })
    })

    test('it saves only specified paths', async () => {
      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2, c: { d: 4, e: 5 } }),
        persist: {
          paths: ['a', 'c.d']
        }
      })

      const test = useTestStore()
      await test.$persistLoaded
      test.$patch({ a: 3 })
      await flushPromises()
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 3, c: { d: 4 } })
    })
  })

  test('it only saves after load', async () => {
    const onSaveError = vi.fn()
    const onSaveSuccess = vi.fn()
    const useTestStore = defineStore('test', {
      state: () => ({ a: 1, b: 2 }),
      persist: {
        onSaveSuccess,
        onSaveError
      }
    })

    const test = useTestStore()
    test.$patch({ a: 3 })
    expect(await mockStorage.getItem('pinia-local-test')).to.eql(undefined)
    // NOTE: it should not even have tried to save, because the subscribe function
    // is called only after loading the initial state.
    expect(mockStorage.setItem).not.toHaveBeenCalled()
    // this asserts that it has not called setState() in persistCurrentState()
    expect(onSaveError).not.toHaveBeenCalled()
    expect(onSaveSuccess).not.toHaveBeenCalled()
    await test.$persistLoaded
    test.$patch({ a: 4 })
    expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 4, b: 2 })
  })

  describe('saveImmediatelyActions', () => {
    test('it should only persist state after specified actions', async () => {
      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        actions: {
          increaseA () {
            ++this.a
          },
          increaseB () {
            ++this.b
          }
        },
        persist: {
          saveImmediatelyActions: ['increaseA']
        }
      })

      const test = useTestStore()
      await test.$persistLoaded
      await test.increaseA()
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 2, b: 2 })
      await test.increaseB()
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 2, b: 2 })
      await test.increaseA()
      expect(await mockStorage.getItem('pinia-local-test')).to.eql({ a: 3, b: 3 })
    })
  })

  describe('onSaveSuccess / onSaveError', () => {
    test('onSaveSuccess is called after setState', async () => {
      const onSaveSuccess = vi.fn()
      const onSaveError = vi.fn()
      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {
          onSaveSuccess,
          onSaveError
        }
      })

      const test = useTestStore()
      await test.$persistLoaded
      test.$patch({ a: 3 })
      await flushPromises()
      expect(onSaveSuccess).toHaveBeenCalledTimes(1)
      expect(onSaveError).toHaveBeenCalledTimes(0)
      test.$patch({ a: 4 })
      await flushPromises()
      expect(onSaveSuccess).toHaveBeenCalledTimes(2)
      expect(onSaveError).toHaveBeenCalledTimes(0)
    })

    test('onSaveError is called after setState fails', async () => {
      mockStorage.setItem = vi.fn(async () => {
        throw new Error('cannot save')
      })
      const onSaveSuccess = vi.fn()
      const onSaveError = vi.fn()
      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {
          onSaveSuccess,
          onSaveError
        }
      })

      const test = useTestStore()
      await test.$persistLoaded
      await test.$patch({ a: 3 })
      expect(onSaveSuccess).toHaveBeenCalledTimes(0)
      expect(onSaveError).toHaveBeenCalledTimes(1)
      await test.$patch({ a: 4 })
      expect(onSaveSuccess).toHaveBeenCalledTimes(0)
      expect(onSaveError).toHaveBeenCalledTimes(2)
    })
  })

  describe('afterLoad', () => {
    test('it is called with the saved state object', async () => {
      await mockStorage.setItem('pinia-local-test', { a: 2 })
      const afterLoad = vi.fn(async orig => {
        return { a: orig.a + 1 }
      })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {
          afterLoad
        }
      })
      const test = useTestStore()
      await test.$persistLoaded
      expect(afterLoad).toHaveBeenCalledTimes(1)
      expect(afterLoad).toHaveBeenCalledWith({ a: 2 })
      expect(test.a).to.eql(3)
    })

    test('it is called with empty object if there is no saved state', async () => {
      const afterLoad = vi.fn(async () => {
        return { a: 3 }
      })

      const useTestStore = defineStore('test', {
        state: () => ({ a: 1, b: 2 }),
        persist: {
          afterLoad
        }
      })
      const test = useTestStore()
      await test.$persistLoaded
      expect(afterLoad).toHaveBeenCalledTimes(1)
      expect(afterLoad).toHaveBeenCalledWith({})
      expect(test.a).to.eql(3)
    })
  })
})
