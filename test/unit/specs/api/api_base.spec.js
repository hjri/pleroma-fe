import {
  apiUrl,
  serverUrl,
  setApiBase,
  streamingUrl,
} from 'src/api/api_base.js'
import { promisedRequest } from 'src/api/helpers.js'

describe('API base', () => {
  afterEach(() => {
    setApiBase(null)
    vi.unstubAllGlobals()
  })

  it('leaves paths alone when the page is the instance', () => {
    expect(apiUrl('/api/v1/instance')).to.equal('/api/v1/instance')
  })

  it('puts the chosen instance in front of paths', () => {
    setApiBase('https://pleroma.example/')
    expect(apiUrl('/api/v1/instance')).to.equal(
      'https://pleroma.example/api/v1/instance',
    )
  })

  it('leaves full URLs alone', () => {
    setApiBase('https://pleroma.example')
    expect(apiUrl('https://media.example/a.png')).to.equal(
      'https://media.example/a.png',
    )
  })

  it('builds the streaming URL on the instance', () => {
    // absolute also on the instance itself: WebSocket takes relative URLs
    // only in recent browsers (Chrome 125, Firefox 124, Safari 17.3)
    const ws = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    expect(streamingUrl('/api/v1/streaming?x=1')).to.equal(
      `${ws}//${window.location.host}/api/v1/streaming?x=1`,
    )
    setApiBase('https://pleroma.example')
    expect(streamingUrl('/api/v1/streaming?x=1')).to.equal(
      'wss://pleroma.example/api/v1/streaming?x=1',
    )
    setApiBase('http://localhost:4000')
    expect(streamingUrl('/socket')).to.equal('ws://localhost:4000/socket')
  })

  it('sends every API request to the instance', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
      )
    vi.stubGlobal('fetch', fetch)
    setApiBase('https://pleroma.example')
    await promisedRequest({ url: '/api/v1/timelines/home' })
    expect(fetch.mock.calls[0][0]).to.equal(
      'https://pleroma.example/api/v1/timelines/home',
    )
  })
})

describe('instance asset URLs', () => {
  it('puts the server in front of a path, leaves full URLs alone', () => {
    expect(serverUrl('https://pleroma.example', '/images/avi.png')).to.equal(
      'https://pleroma.example/images/avi.png',
    )
    expect(
      serverUrl('https://pleroma.example', 'https://cdn.example/a.png'),
    ).to.equal('https://cdn.example/a.png')
  })
})
