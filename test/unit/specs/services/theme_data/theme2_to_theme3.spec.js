import {
  basePaletteKeys,
  convertTheme2To3,
} from 'src/services/theme_data/theme2_to_theme3.js'

describe('Theme 2 to Theme 3 conversion', () => {
  it('converts font descriptors to CSS font families', () => {
    const colors = Object.fromEntries(
      [...basePaletteKeys].map((key) => [key, '#000000']),
    )
    const rules = convertTheme2To3({
      colors,
      fonts: {
        interface: { family: 'sans-serif' },
        input: { family: 'Open Sans' },
        post: { family: 'Atkinson Hyperlegible' },
        postCode: { family: 'monospace' },
      },
    })

    expect(rules).to.deep.include({
      source: '2to3',
      component: 'Root',
      directives: { '--font': 'generic | sans-serif' },
    })
    expect(rules).to.deep.include({
      source: '2to3',
      component: 'Root',
      directives: { '--monoFont': 'generic | monospace' },
    })
    expect(rules).to.deep.include({
      source: '2to3',
      component: 'Input',
      directives: { '--font': 'generic | Open Sans' },
    })
    expect(rules).to.deep.include({
      source: '2to3',
      component: 'RichContent',
      directives: { '--font': 'generic | Atkinson Hyperlegible' },
    })
  })
})
