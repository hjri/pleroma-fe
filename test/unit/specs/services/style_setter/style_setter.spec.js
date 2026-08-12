import {
  getResourcesIndex,
  hasInvalidCachedThemeRules,
} from 'src/services/style_setter/style_setter.js'

describe('resource index', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('ignores an HTML fallback returned for a missing custom index', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ builtin: { version: 1 } }), {
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response('<!doctype html><title>Pleroma</title>', {
            headers: { 'Content-Type': 'text/html' },
          }),
        ),
    )

    const resources = await getResourcesIndex('/static/styles.json')

    expect(Object.keys(resources)).to.deep.equal(['builtin'])
    expect(resources.builtin()).to.deep.equal({ version: 1 })
  })
})

describe('style setter cache', () => {
  it('rejects cached rules containing serialized objects', () => {
    expect(
      hasInvalidCachedThemeRules([
        ['html { --font: [object Object]; }'],
        ['.post { --font: sans-serif; }'],
      ]),
    ).to.equal(true)
  })

  it('accepts cached rules containing valid font families', () => {
    expect(
      hasInvalidCachedThemeRules([
        ['html { --font: sans-serif; }'],
        [
          '.post { --font: "Atkinson Hyperlegible"; }',
          '.post::after { content: "[object Object]"; }',
        ],
      ]),
    ).to.equal(false)
  })
})
