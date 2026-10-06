import {
  checkInstance,
  chooseInstance,
  chosenInstance,
  forgetInstance,
  instanceConfig,
  instanceOrigin,
  isHosted,
} from 'src/services/hosted/hosted.js'

describe('hosted mode', () => {
  afterEach(() => forgetInstance())

  it('is on only when the site says so', () => {
    expect(isHosted({ hosted: true })).to.equal(true)
    expect(isHosted({})).to.equal(false)
    expect(isHosted(null)).to.equal(false)
  })

  it('reads an instance from what people type', () => {
    expect(instanceOrigin('pleroma.example')).to.equal(
      'https://pleroma.example',
    )
    expect(instanceOrigin(' Pleroma.Example/ ')).to.equal(
      'https://pleroma.example',
    )
    expect(instanceOrigin('@me@pleroma.example')).to.equal(
      'https://pleroma.example',
    )
    expect(instanceOrigin('https://pleroma.example/main/all')).to.equal(
      'https://pleroma.example',
    )
    expect(instanceOrigin('http://localhost:4000')).to.equal(
      'http://localhost:4000',
    )
    // a token never goes over plain http to a real server
    expect(instanceOrigin('http://pleroma.example')).to.equal(
      'https://pleroma.example',
    )
    expect(instanceOrigin('')).to.equal(null)
    expect(instanceOrigin('not a domain')).to.equal(null)
  })

  it('remembers the chosen instance until it is forgotten', () => {
    expect(chosenInstance()).to.equal(null)
    chooseInstance('https://pleroma.example')
    expect(chosenInstance()).to.equal('https://pleroma.example')
    forgetInstance()
    expect(chosenInstance()).to.equal(null)
  })

  it('checks that an instance answers with its API', async () => {
    const json = (body) =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    const ok = vi.fn(() => json({ uri: 'pleroma.example', title: 'P' }))
    expect(await checkInstance('https://pleroma.example', ok)).to.equal(true)
    expect(ok.mock.calls[0][0]).to.equal(
      'https://pleroma.example/api/v1/instance',
    )
    const html = () => Promise.resolve(new Response('<html></html>'))
    expect(await checkInstance('https://example.com', html)).to.equal(false)
    const down = () => Promise.reject(new TypeError('Failed to fetch'))
    expect(await checkInstance('https://gone.example', down)).to.equal(false)
  })
})

describe('the instance config in hosted mode', () => {
  it('points the instance paths at the instance', () => {
    const resolve = (p) => `https://pleroma.example${p}`
    expect(
      instanceConfig(
        {
          logo: '/static/logo.svg',
          background: 'https://cdn.example/bg.png',
          name: 'Pleroma',
          loginMethod: 'password',
          redirectRootNoLogin: '/main/all',
        },
        resolve,
      ),
    ).to.eql({
      logo: 'https://pleroma.example/static/logo.svg',
      background: 'https://cdn.example/bg.png',
      name: 'Pleroma',
      // the redirect login is the only one that works from another site
      loginMethod: 'token',
      // app routes stay app routes
      redirectRootNoLogin: '/main/all',
    })
  })

  it('copes with no config from the instance', () => {
    expect(instanceConfig(undefined, (p) => p)).to.eql({ loginMethod: 'token' })
  })
})
