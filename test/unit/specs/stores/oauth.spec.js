import { createApp } from 'vue'
import { createStore } from 'vuex'
import { createPinia, setActivePinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { useOAuthStore } from 'src/stores/oauth.js'
import { injectMswToTest, authApis, testServer } from '/test/fixtures/mock_api.js'

const test = injectMswToTest(authApis)

const vuexStore = createStore({
  modules: {
    instance: {
      state: () => ({ server: testServer })
    }
  }
})
const app = createApp({})
app.use(vuexStore)
window.vuex = vuexStore

const getStore = (defaultStateInjection) => {
  const pinia = createPinia().use(({ store }) => {
    if (store.$id === 'oauth') {
      store.$patch(defaultStateInjection)
    }
  })
  app.use(pinia)
  setActivePinia(pinia)
  return useOAuthStore()
}


describe('createApp', () => {
  test('it should use create an app and record client id and secret', async () => {
    const store = getStore()
    const app = await store.createApp()
    expect(store.clientId).to.eql('test-id')
    expect(store.clientSecret).to.eql('test-secret')
    expect(app.clientId).to.eql('test-id')
    expect(app.clientSecret).to.eql('test-secret')
  })

  test('it should throw and not update if failed', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/api/v1/apps`, () => {
        return HttpResponse.text('Throttled', { status: 429 })
      })
    )

    const store = getStore()
    const res = store.createApp()
    await expect(res).rejects.toThrowError('Throttled')
    expect(store.clientId).to.eql(false)
    expect(store.clientSecret).to.eql(false)
  })
})

describe('ensureApp', () => {
  test('it should create an app if it does not exist', async () => {
    const store = getStore()
    const app = await store.ensureApp()
    expect(store.clientId).to.eql('test-id')
    expect(store.clientSecret).to.eql('test-secret')
    expect(app.clientId).to.eql('test-id')
    expect(app.clientSecret).to.eql('test-secret')
  })

  test('it should not create an app if it exists', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/api/v1/apps`, () => {
        return HttpResponse.text('Should not call this API', { status: 400 })
      })
    )

    const store = getStore({
      clientId: 'another-id',
      clientSecret: 'another-secret'
    })
    const app = await store.ensureApp()
    expect(store.clientId).to.eql('another-id')
    expect(store.clientSecret).to.eql('another-secret')
    expect(app.clientId).to.eql('another-id')
    expect(app.clientSecret).to.eql('another-secret')
  })
})

describe('getAppToken', () => {
  test('it should get app token and set it in state', async () => {
    const store = getStore({
      clientId: 'test-id',
      clientSecret: 'test-secret'
    })
    const token = await store.getAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
  })

  test('it should throw and not set state if it cannot get app token', async () => {
    const store = getStore({
      clientId: 'bad-id',
      clientSecret: 'bad-secret'
    })
    await expect(store.getAppToken()).rejects.toThrowError('400')
    expect(store.appToken).to.eql(false)
  })
})

describe('ensureAppToken', () => {
  test('it should work if the state is empty', async () => {
    const store = getStore()
    const token = await store.ensureAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
  })

  test('it should work if we already have a working token', async () => {
    const store = getStore({
      appToken: 'also-good-app-token'
    })
    const token = await store.ensureAppToken()
    expect(token).to.eql('also-good-app-token')
    expect(store.appToken).to.eql('also-good-app-token')
  })

  test('it should work if we have a bad token but good app credentials', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/api/v1/apps`, () => {
        return HttpResponse.text('Should not call this API', { status: 400 })
      })
    )
    const store = getStore({
      appToken: 'bad-app-token',
      clientId: 'test-id',
      clientSecret: 'test-secret'
    })
    const token = await store.ensureAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
  })

  test('it should work if we have no token but good app credentials', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/api/v1/apps`, () => {
        return HttpResponse.text('Should not call this API', { status: 400 })
      })
    )
    const store = getStore({
      clientId: 'test-id',
      clientSecret: 'test-secret'
    })
    const token = await store.ensureAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
  })

  test('it should work if we have no token and bad app credentials', async () => {
    const store = getStore({
      clientId: 'bad-id',
      clientSecret: 'bad-secret'
    })
    const token = await store.ensureAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
    expect(store.clientId).to.eql('test-id')
    expect(store.clientSecret).to.eql('test-secret')
  })

  test('it should work if we have bad token and bad app credentials', async () => {
    const store = getStore({
      appToken: 'bad-app-token',
      clientId: 'bad-id',
      clientSecret: 'bad-secret'
    })
    const token = await store.ensureAppToken()
    expect(token).to.eql('test-app-token')
    expect(store.appToken).to.eql('test-app-token')
    expect(store.clientId).to.eql('test-id')
    expect(store.clientSecret).to.eql('test-secret')
  })

  test('it should throw if we cannot create an app', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/api/v1/apps`, () => {
        return HttpResponse.text('Throttled', { status: 429 })
      })
    )

    const store = getStore()
    await expect(store.ensureAppToken()).rejects.toThrowError('Throttled')
  })

  test('it should throw if we cannot obtain app token', async ({ worker }) => {
    worker.use(
      http.post(`${testServer}/oauth/token`, () => {
        return HttpResponse.text('Throttled', { status: 429 })
      })
    )

    const store = getStore()
    await expect(store.ensureAppToken()).rejects.toThrowError('Throttled')
  })
})
