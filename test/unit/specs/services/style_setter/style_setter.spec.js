import { hasInvalidCachedThemeRules } from 'src/services/style_setter/style_setter.js'

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
