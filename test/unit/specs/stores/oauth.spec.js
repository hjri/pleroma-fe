import { createTestingPinia } from '@pinia/testing'
import { HttpResponse, http } from 'msw'
import { setActivePinia } from 'pinia'

import { test as it } from '/test/fixtures/mock_api.js'

import { useOAuthStore } from 'src/stores/oauth.js'

import {
  MASTODON_APP_URL,
  MASTODON_APP_VERIFY_URL,
  OAUTH_TOKEN_URL,
} from 'src/api/oauth.js'

const authApis = () => [
  http.post(MASTODON_APP_URL, () => {
    return HttpResponse.json({
      client_id: 'test-id',
      client_secret: 'test-secret',
    })
  }),
  http.get(MASTODON_APP_VERIFY_URL, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (
      authHeader === 'Bearer test-app-token' ||
      authHeader === 'Bearer also-good-app-token'
    ) {
      return HttpResponse.json({})
    } else {
      // Pleroma 2.9.0 gives the following respoonse upon error
      return HttpResponse.json(
        { error: { detail: 'Internal server error' } },
        {
          status: 400,
        },
      )
    }
  }),
  http.post(OAUTH_TOKEN_URL, async ({ request }) => {
    const data = await request.formData()

    if (
      data.get('client_id') === 'test-id' &&
      data.get('client_secret') === 'test-secret' &&
      data.get('grant_type') === 'client_credentials' &&
      data.has('redirect_uri')
    ) {
      return HttpResponse.json({ access_token: 'test-app-token' })
    } else {
      // Pleroma 2.9.0 gives the following respoonse upon error
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        {
          status: 400,
        },
      )
    }
  }),
]

describe('oauth store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ stubActions: false }))
  })

  describe('createApp', () => {
    it('should use create an app and record client id and secret', async ({
      worker,
    }) => {
      worker.use(
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Throttled', { status: 429 })
        }),
      )

      const store = useOAuthStore()
      worker.use(...authApis())
      const app = await store.createApp()
      expect(store.clientId).to.eql('test-id')
      expect(store.clientSecret).to.eql('test-secret')
      expect(app.clientId).to.eql('test-id')
      expect(app.clientSecret).to.eql('test-secret')
    })

    it('should throw and not update if failed', async ({ worker }) => {
      worker.use(
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Throttled', { status: 429 })
        }),
      )

      const store = useOAuthStore()
      const res = store.createApp()
      await expect(res).rejects.toThrowError('Throttled')
      expect(store.clientId).to.eql(false)
      expect(store.clientSecret).to.eql(false)
    })
  })

  describe('ensureApp', () => {
    it('should create an app if it does not exist', async ({ worker }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      const app = await store.ensureApp()
      expect(store.clientId).to.eql('test-id')
      expect(store.clientSecret).to.eql('test-secret')
      expect(app.clientId).to.eql('test-id')
      expect(app.clientSecret).to.eql('test-secret')
    })

    it('should not create an app if it exists', async ({ worker }) => {
      worker.use(
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Should not call this API', { status: 400 })
        }),
      )

      const store = useOAuthStore()
      store.clientId = 'another-id'
      store.clientSecret = 'another-secret'

      const app = await store.ensureApp()
      expect(store.clientId).to.eql('another-id')
      expect(store.clientSecret).to.eql('another-secret')
      expect(app.clientId).to.eql('another-id')
      expect(app.clientSecret).to.eql('another-secret')
    })
  })

  describe('getAppToken', () => {
    it('should get app token and set it in state', async ({ worker }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      store.clientId = 'test-id'
      store.clientSecret = 'test-secret'

      const token = await store.getAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
    })

    it('should throw and not set state if it cannot get app token', async ({
      worker,
    }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      store.clientId = 'bad-id'
      store.clientSecret = 'bad-secret'

      await expect(store.getAppToken()).rejects.toThrowError('400')
      expect(store.appToken).to.eql(false)
    })
  })

  describe('ensureAppToken', () => {
    it('should work if the state is empty', async ({ worker }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      const token = await store.ensureAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
    })

    it('should work if we already have a working token', async ({ worker }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      store.appToken = 'also-good-app-token'

      const token = await store.ensureAppToken()
      expect(token).to.eql('also-good-app-token')
      expect(store.appToken).to.eql('also-good-app-token')
    })

    it('should work if we have a bad token but good app credentials', async ({
      worker,
    }) => {
      worker.use(
        ...authApis(),
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Should not call this API', { status: 400 })
        }),
      )
      const store = useOAuthStore()
      store.appToken = 'bad-app-token'
      store.clientId = 'test-id'
      store.clientSecret = 'test-secret'

      const token = await store.ensureAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
    })

    it('should work if we have no token but good app credentials', async ({
      worker,
    }) => {
      worker.use(
        ...authApis(),
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Should not call this API', { status: 400 })
        }),
      )
      const store = useOAuthStore()
      store.clientId = 'test-id'
      store.clientSecret = 'test-secret'

      const token = await store.ensureAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
    })

    it('should work if we have no token and bad app credentials', async ({
      worker,
    }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      store.clientId = 'bad-id'
      store.clientSecret = 'bad-secret'

      const token = await store.ensureAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
      expect(store.clientId).to.eql('test-id')
      expect(store.clientSecret).to.eql('test-secret')
    })

    it('should work if we have bad token and bad app credentials', async ({
      worker,
    }) => {
      worker.use(...authApis())
      const store = useOAuthStore()
      store.appToken = 'bad-app-token'
      store.clientId = 'bad-id'
      store.clientSecret = 'bad-secret'

      const token = await store.ensureAppToken()
      expect(token).to.eql('test-app-token')
      expect(store.appToken).to.eql('test-app-token')
      expect(store.clientId).to.eql('test-id')
      expect(store.clientSecret).to.eql('test-secret')
    })

    it('should throw if we cannot create an app', async ({ worker }) => {
      worker.use(
        http.post(MASTODON_APP_URL, () => {
          return HttpResponse.text('Throttled', { status: 429 })
        }),
      )

      const store = useOAuthStore()
      await expect(store.ensureAppToken()).rejects.toThrowError('Throttled')
    })

    it('should throw if we cannot obtain app token', async ({ worker }) => {
      worker.use(
        http.post(OAUTH_TOKEN_URL, () => {
          return HttpResponse.text('Throttled', { status: 429 })
        }),
      )

      const store = useOAuthStore()
      await expect(store.getAppToken()).rejects.toThrowError('Throttled')
    })
  })
})
