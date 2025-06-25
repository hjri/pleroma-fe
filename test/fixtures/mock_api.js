import { test as testBase } from 'vitest'
import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw'

// https://mswjs.io/docs/recipes/vitest-browser-mode
export const injectMswToTest = (defaultHandlers) => {
  const worker = setupWorker(...defaultHandlers)

  return testBase.extend({
    worker: [
      async ({}, use) => {
        await worker.start()

        await use(worker)

        worker.resetHandlers()
        worker.stop()
      },
      {
        auto: true
      }
    ],
  })
}

export const testServer = 'https://test.server.example'

export const authApis = [
  http.post(`${testServer}/api/v1/apps`, () => {
    return HttpResponse.json({
      client_id: 'test-id',
      client_secret: 'test-secret'
    })
  }),
  http.get(`${testServer}/api/v1/apps/verify_credentials`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (authHeader === 'Bearer test-app-token' ||
        authHeader === 'Bearer also-good-app-token') {
      return HttpResponse.json({})
    } else {
      // Pleroma 2.9.0 gives the following respoonse upon error
      return HttpResponse.json({ error: { detail: 'Internal server error' } }, {
        status: 400
      })
    }
  }),
  http.post(`${testServer}/oauth/token`, async ({ request }) => {
    const data = await request.formData()

    if (data.get('client_id') === 'test-id' &&
       data.get('client_secret') === 'test-secret' &&
       data.get('grant_type') === 'client_credentials' &&
       data.has('redirect_uri')) {
      return HttpResponse.json({ access_token: 'test-app-token' })
    } else {
      // Pleroma 2.9.0 gives the following respoonse upon error
      return HttpResponse.json({ error: 'Invalid credentials' }, {
        status: 400
      })
    }
  })
]
